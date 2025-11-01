'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardBody, Button } from '@/components/ui';

interface VoiceAgentProps {
  userId?: string;
  goalType?: string;
  region?: string;
  onClose?: () => void;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
type ConversationState = 'idle' | 'listening' | 'speaking' | 'thinking';

export function VoiceAgent({ userId, goalType, region = 'US', onClose }: VoiceAgentProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);

  /**
   * Request microphone permission
   */
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setIsPermissionGranted(true);
      setError(null);
      return true;
    } catch (err) {
      console.error('Microphone permission denied:', err);
      setError('Microphone permission is required for voice conversations');
      return false;
    }
  };

  /**
   * Connect to OpenAI Realtime API
   */
  const connect = async () => {
    if (connectionState !== 'disconnected') return;

    // Request mic permission first
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;

    setConnectionState('connecting');
    setError(null);

    try {
      // Get voice agent configuration from our API
      const configResponse = await fetch('/api/ai/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-config',
          userId,
          goalType,
          region,
        }),
      });

      if (!configResponse.ok) {
        throw new Error('Failed to get voice agent configuration');
      }

      const config = await configResponse.json();

      // Connect to OpenAI Realtime API using model from config
      const ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=${config.model}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
            'OpenAI-Beta': 'realtime=v1',
          },
        } as any
      );

      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Voice Agent] Connected to OpenAI Realtime API');
        setConnectionState('connected');
        setConversationState('idle');

        // Send session configuration
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: config.modalities,
            instructions: config.instructions,
            voice: config.voice,
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: config.input_audio_transcription,
            turn_detection: config.turn_detection,
            tools: config.tools,
            temperature: config.temperature,
          },
        }));

        // Start streaming audio from microphone
        startAudioStreaming();
      };

      ws.onmessage = (event) => {
        handleRealtimeEvent(JSON.parse(event.data));
      };

      ws.onerror = (error) => {
        console.error('[Voice Agent] WebSocket error:', error);
        setConnectionState('error');
        setError('Connection error occurred');
      };

      ws.onclose = () => {
        console.log('[Voice Agent] Disconnected');
        setConnectionState('disconnected');
        setConversationState('idle');
        cleanup();
      };
    } catch (err) {
      console.error('[Voice Agent] Connection failed:', err);
      setConnectionState('error');
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  };

  /**
   * Disconnect from Realtime API
   */
  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    cleanup();
  };

  /**
   * Start streaming audio from microphone to OpenAI
   */
  const startAudioStreaming = async () => {
    if (!mediaStreamRef.current) return;

    try {
      // Create audio context for processing
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(mediaStreamRef.current);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);

          // Convert Float32Array to Int16Array (PCM16)
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          // Send audio data to OpenAI
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio,
          }));
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      console.log('[Voice Agent] Audio streaming started');
    } catch (err) {
      console.error('[Voice Agent] Failed to start audio streaming:', err);
      setError('Failed to start audio streaming');
    }
  };

  /**
   * Handle events from OpenAI Realtime API
   */
  const handleRealtimeEvent = (event: any) => {
    console.log('[Voice Agent] Event:', event.type);

    switch (event.type) {
      case 'conversation.item.input_audio_transcription.completed':
        // User's speech was transcribed
        setTranscript((prev) => prev + `\n\nYou: ${event.transcript}`);
        setConversationState('thinking');
        break;

      case 'response.audio.delta':
        // AI is speaking - queue audio chunks
        setConversationState('speaking');
        const audioChunk = base64ToFloat32Array(event.delta);
        audioQueueRef.current.push(audioChunk);
        playAudioQueue();
        break;

      case 'response.audio_transcript.delta':
        // AI's speech transcript
        setTranscript((prev) => {
          const lines = prev.split('\n\n');
          const lastLine = lines[lines.length - 1];
          if (lastLine.startsWith('AI: ')) {
            lines[lines.length - 1] = lastLine + event.delta;
          } else {
            lines.push('AI: ' + event.delta);
          }
          return lines.join('\n\n');
        });
        break;

      case 'response.audio.done':
        // AI finished speaking
        setConversationState('listening');
        break;

      case 'response.function_call_arguments.done':
        // Function call completed
        handleFunctionCall(event);
        break;

      case 'input_audio_buffer.speech_started':
        setConversationState('listening');
        break;

      case 'input_audio_buffer.speech_stopped':
        setConversationState('thinking');
        break;

      case 'error':
        console.error('[Voice Agent] Error event:', event);
        setError(event.error?.message || 'An error occurred');
        break;
    }
  };

  /**
   * Handle function calls from the AI
   */
  const handleFunctionCall = async (event: any) => {
    const { name, arguments: args, call_id } = event;
    console.log('[Voice Agent] Function call:', name, args);

    try {
      let result;

      switch (name) {
        case 'calculate_monthly_savings':
          const monthlyPayment = await calculateMonthlySavings(
            args.target_amount,
            args.years,
            args.current_savings || 0,
            (args.annual_return || 5) / 100
          );
          result = { monthly_payment: monthlyPayment };
          break;

        case 'calculate_future_value':
          const futureValue = await calculateFutureValue(
            args.current_savings,
            args.monthly_contribution,
            args.years,
            (args.annual_return || 5) / 100
          );
          result = { future_value: futureValue };
          break;

        case 'get_user_context':
          // Fetch user context from our backend
          const contextResponse = await fetch(`/api/user/context?userId=${args.user_id}`);
          result = await contextResponse.json();
          break;

        default:
          result = { error: 'Unknown function' };
      }

      // Send function result back to AI
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id,
            output: JSON.stringify(result),
          },
        }));
      }
    } catch (err) {
      console.error('[Voice Agent] Function call error:', err);
    }
  };

  /**
   * Play queued audio chunks
   */
  const playAudioQueue = async () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) return;

    const audioContext = audioContextRef.current;
    const audioChunk = audioQueueRef.current.shift()!;

    const audioBuffer = audioContext.createBuffer(1, audioChunk.length, 24000);
    audioBuffer.getChannelData(0).set(audioChunk);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();

    // Continue playing queue
    if (audioQueueRef.current.length > 0) {
      setTimeout(() => playAudioQueue(), 50);
    }
  };

  /**
   * Cleanup resources
   */
  const cleanup = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    audioQueueRef.current = [];
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardBody className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">🎤 Voice Coach</h2>
              <p className="text-sm text-gray-600 mt-1">
                Have a natural conversation with your AI financial coach
              </p>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-gray-600"
              >
                Close
              </Button>
            )}
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              connectionState === 'connected' ? 'bg-green-500' :
              connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              connectionState === 'error' ? 'bg-red-500' :
              'bg-gray-300'
            }`} />
            <span className="text-sm font-medium text-gray-700">
              {connectionState === 'connected' && 'Connected'}
              {connectionState === 'connecting' && 'Connecting...'}
              {connectionState === 'disconnected' && 'Disconnected'}
              {connectionState === 'error' && 'Connection Error'}
            </span>
          </div>

          {/* Conversation State Indicator */}
          {connectionState === 'connected' && (
            <div className="flex items-center justify-center">
              <div className="text-center">
                {conversationState === 'listening' && (
                  <>
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                      <span className="text-3xl">👂</span>
                    </div>
                    <p className="text-sm font-medium text-blue-600">Listening...</p>
                  </>
                )}
                {conversationState === 'thinking' && (
                  <>
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-3xl animate-spin">🤔</span>
                    </div>
                    <p className="text-sm font-medium text-purple-600">Thinking...</p>
                  </>
                )}
                {conversationState === 'speaking' && (
                  <>
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center animate-pulse">
                      <span className="text-3xl">🗣️</span>
                    </div>
                    <p className="text-sm font-medium text-green-600">Speaking...</p>
                  </>
                )}
                {conversationState === 'idle' && (
                  <>
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-3xl">💬</span>
                    </div>
                    <p className="text-sm font-medium text-gray-600">Ready</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Transcript */}
          {transcript && (
            <div className="p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Conversation</h3>
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {transcript}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            {connectionState === 'disconnected' && (
              <Button
                variant="primary"
                size="lg"
                onClick={connect}
                className="px-8"
              >
                Start Voice Chat
              </Button>
            )}
            {connectionState === 'connected' && (
              <Button
                variant="danger"
                size="lg"
                onClick={disconnect}
                className="px-8"
              >
                End Chat
              </Button>
            )}
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>• Speak naturally - the AI will respond in real-time</p>
            <p>• The AI can perform calculations and access your financial data</p>
            <p>• Your conversation is secure and private</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// Helper functions

function base64ToFloat32Array(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
}

async function calculateMonthlySavings(
  targetAmount: number,
  years: number,
  currentSavings: number,
  annualRate: number
): Promise<number> {
  const months = years * 12;
  const monthlyRate = annualRate / 12;
  const futureValueOfCurrentSavings = currentSavings * Math.pow(1 + monthlyRate, months);
  const remainingAmount = targetAmount - futureValueOfCurrentSavings;

  if (remainingAmount <= 0) return 0;

  const monthlyPayment = remainingAmount * (monthlyRate / (Math.pow(1 + monthlyRate, months) - 1));
  return Math.round(monthlyPayment * 100) / 100;
}

async function calculateFutureValue(
  currentSavings: number,
  monthlyContribution: number,
  years: number,
  annualRate: number
): Promise<number> {
  const months = years * 12;
  const monthlyRate = annualRate / 12;
  const futureValueOfCurrentSavings = currentSavings * Math.pow(1 + monthlyRate, months);
  const futureValueOfContributions = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  return Math.round((futureValueOfCurrentSavings + futureValueOfContributions) * 100) / 100;
}
