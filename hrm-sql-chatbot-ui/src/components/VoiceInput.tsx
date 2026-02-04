import { useState } from 'react';
import './VoiceInput.css';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  inputValue?: string;
  setInputValue?: (value: string) => void;
}

export default function VoiceInput({ onTranscript, disabled, inputValue = '', setInputValue }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');

  // Check browser support
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const isSupported = !!SpeechRecognition;

  const startListening = () => {
    if (!isSupported) {
      setError('Trình duyệt không hỗ trợ nhập giọng nói');
      return;
    }

    setError(null);
    setInterimTranscript('');
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'vi-VN'; // Vietnamese
    recognition.interimResults = true; // Show interim results
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);

      // If final result, update input and auto-send
      if (final) {
        const combinedText = inputValue + final;
        if (setInputValue) {
          setInputValue(combinedText);
        }
        onTranscript(combinedText);
        setIsListening(false);
        setInterimTranscript('');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      let errorMsg = 'Lỗi nhận diện giọng nói';
      
      if (event.error === 'no-speech') {
        errorMsg = 'Không nghe thấy giọng nói. Vui lòng thử lại!';
      } else if (event.error === 'audio-capture') {
        errorMsg = 'Không tìm thấy microphone. Kiểm tra thiết bị!';
      } else if (event.error === 'not-allowed') {
        errorMsg = 'Vui lòng cho phép sử dụng microphone trong cài đặt';
      } else if (event.error === 'network') {
        errorMsg = 'Lỗi kết nối mạng. Kiểm tra internet!';
      }
      
      setError(errorMsg);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      setError('Không thể khởi động nhận diện giọng nói');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (isListening) {
      setIsListening(false);
    }
  };

  if (!isSupported) {
    return null; // Hide if not supported
  }

  return (
    <div className="voice-input-container">
      <button
        type="button"
        className={`voice-btn ${isListening ? 'listening' : ''}`}
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        title={isListening ? 'Dừng nghe' : 'Nhập bằng giọng nói (Tiếng Việt)'}
      >
        {isListening ? (
          <div className="listening-animation">
            <span className="wave"></span>
            <span className="wave"></span>
            <span className="wave"></span>
          </div>
        ) : (
          <span className="mic-icon">🎤</span>
        )}
      </button>
      
      {/* Show interim transcript while listening */}
      {interimTranscript && (
        <div className="voice-interim-text">
          {interimTranscript}
        </div>
      )}
      
      {/* Show errors */}
      {error && (
        <div className="voice-error">
          <span>⚠️ {error}</span>
          <button 
            className="error-close" 
            onClick={() => setError(null)}
            title="Đóng"
          >
            ✕
          </button>
        </div>
      )}

      {/* Show status */}
      {isListening && !interimTranscript && (
        <div className="voice-status">
          🎤 Đang lắng nghe...
        </div>
      )}
    </div>
  );
}
