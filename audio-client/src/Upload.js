                                        import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
    TextField,
    Button,
    Box,
    Typography,
    Paper,
    Avatar,
    CircularProgress,
    IconButton,
    Container,
    LinearProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { keyframes } from '@mui/system';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import PersonIcon from '@mui/icons-material/Person';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { styled } from '@mui/material/styles';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Audio wave animation keyframes
const wave1 = keyframes`
  0%, 100% { height: 8px; }
  50% { height: 22px; }
`;

const wave2 = keyframes`
  0%, 100% { height: 12px; }
  25% { height: 28px; }
  75% { height: 18px; }
`;

const wave3 = keyframes`
  0%, 100% { height: 14px; }
  35% { height: 32px; }
  65% { height: 10px; }
`;

const wave4 = keyframes`
  0%, 100% { height: 10px; }
  45% { height: 24px; }
  85% { height: 16px; }
`;

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

const AudioWaveBackground = () => {
    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '100vh',
                overflow: 'hidden',
                zIndex: -1,
                opacity: 0.5,
                pointerEvents: 'none',
                backgroundColor: '#f8f9fa',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    height: '100%',
                    width: '100%',
                }}
            >
                {Array.from({ length: 80 }).map((_, index) => (
                    <Box
                        key={index}
                        sx={{
                            width: '3px',
                            backgroundColor: '#00b8d4',
                            borderRadius: '2px',
                            animation: `${index % 4 === 0 ? wave1 : index % 4 === 1 ? wave2 : index % 4 === 2 ? wave3 : wave4} ${2 + (index % 5) * 0.2}s ease-in-out infinite`,
                            animationDelay: `${index * 0.05}s`,
                            height: '10px',
                        }}
                    />
                ))}
            </Box>
        </Box>
    );
};

const Upload = () => {
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [processingTime, setProcessingTime] = useState(0);
    const [estimatedTotalTime, setEstimatedTotalTime] = useState(0);
    const [messages, setMessages] = useState([
        { text: 'Welcome to the Audio Analysis System! Please upload an audio file for analysis.', sender: 'bot' }
    ]);
    const messagesEndRef = useRef(null);
    const progressInterval = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
            }
        };
    }, []);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            addMessage(`Selected file: ${selectedFile.name}`, 'user');
            
            // Estimate processing time based on file size (rough estimate)
            const fileSizeInMB = selectedFile.size / (1024 * 1024);
            // Assume 10 seconds per MB as a rough estimate for processing time
            const estimatedSeconds = Math.max(10, Math.round(fileSizeInMB * 10));
            setEstimatedTotalTime(estimatedSeconds);
        }
    };

    const addMessage = (text, sender) => {
        setMessages(prev => [...prev, { text, sender }]);
    };

    const updateProgressBar = () => {
        setProcessingTime(prev => {
            const newTime = prev + 1;
            // Calculate progress percentage based on estimated total time
            const newProgress = Math.min(95, Math.round((newTime / estimatedTotalTime) * 100));
            setProgress(newProgress);
            return newTime;
        });
    };

    const resetFileInput = () => {
        // Reset file state
        setFile(null);
        // Reset file input element
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUpload = async () => {
        if (!file) {
            addMessage('Please select a file first', 'bot');
            return;
        }

        setLoading(true);
        setProgress(0);
        setProcessingTime(0);
        addMessage('Processing your file...', 'bot');

        // Start progress simulation
        progressInterval.current = setInterval(updateProgressBar, 1000);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:5000/analyze', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            // Clear the interval when response is received
            clearInterval(progressInterval.current);
            setProgress(100);
            
            console.log('Response from server:', response.data);
            setResult(response.data.transcript);
            addMessage('Analysis completed successfully!', 'bot');
            addMessage(`Transcript: ${response.data.transcript}`, 'bot');
            addMessage(`Estimated number of speakers: ${response.data.num_speakers}`, 'bot');
            
            // Reset file after successful transcription
            resetFileInput();
        } catch (error) {
            // Clear the interval on error
            clearInterval(progressInterval.current);
            console.error('Error uploading file:', error);
            addMessage('An error occurred while processing the file. Please try again.', 'bot');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AudioWaveBackground />

            <Container maxWidth="sm" sx={{ py: 4 }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '85vh',
                        width: '100%',
                        backgroundColor: 'rgba(250, 250, 252, 0.9)',
                        padding: 2,
                        borderRadius: 2,
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                        fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", sans-serif',
                        backdropFilter: 'blur(5px)',
                        border: '1px solid rgba(231, 234, 243, 0.7)',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: 2,
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #00b8d4 0%, #0088a3 100%)',
                            color: 'white',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            marginBottom: 2,
                        }}
                    >
                        <Avatar sx={{
                            bgcolor: 'white',
                            color: '#00b8d4',
                            marginRight: 2,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                            <GraphicEqIcon />
                        </Avatar>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem', mr: 1 }}>
                                    SoundSense AI
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Audio Analysis & Transcription
                            </Typography>
                        </Box>
                        <Box sx={{ ml: 'auto' }}>
                            <IconButton size="small" sx={{ color: 'white' }}>
                                <AnalyticsIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    <Paper
                        elevation={0}
                        sx={{
                            padding: 2,
                            flexGrow: 1,
                            overflowY: 'auto',
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5,
                            '&::-webkit-scrollbar': {
                                width: '6px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: '#c1c1c1',
                                borderRadius: '3px',
                            },
                            border: '1px solid rgba(231, 234, 243, 0.7)',
                        }}
                    >
                        {messages.length === 0 && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    opacity: 0.7,
                                }}
                            >
                                <AudioFileIcon sx={{ fontSize: 60, color: '#00b8d4', mb: 2 }} />
                                <Typography variant="body1" sx={{ textAlign: 'center', color: '#666' }}>
                                    Upload an audio file to begin analysis
                                </Typography>
                            </Box>
                        )}

                        {messages.map((message, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                                    animation: `${fadeIn} 0.3s ease-out`,
                                }}
                            >
                                {message.sender === 'bot' && (
                                    <Avatar
                                        sx={{
                                            bgcolor: '#00b8d4',
                                            width: 32,
                                            height: 32,
                                            mr: 1,
                                            alignSelf: 'flex-end',
                                            mb: 0.5,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <GraphicEqIcon sx={{ fontSize: 16 }} />
                                    </Avatar>
                                )}
                                <Box
                                    sx={{
                                        padding: 1.5,
                                        maxWidth: '75%',
                                        backgroundColor: '#f5f7fa',
                                        color: '#333',
                                        borderRadius: message.sender === 'user'
                                            ? '12px 12px 4px 12px'
                                            : '12px 12px 12px 4px',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                        wordBreak: 'break-word',
                                        fontWeight: 300,
                                        fontSize: '0.95rem',
                                        fontFamily: '"Segoe UI", Roboto, sans-serif',
                                        whiteSpace: 'pre-wrap',
                                        border: '1px solid rgba(231, 234, 243, 0.7)',
                                    }}
                                >
                                    {message.text}
                                </Box>
                                {message.sender === 'user' && (
                                    <Avatar
                                        sx={{
                                            bgcolor: 'grey',
                                            width: 32,
                                            height: 32,
                                            ml: 1,
                                            alignSelf: 'flex-end',
                                            mb: 0.5,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <PersonIcon sx={{ fontSize: 16 }} />
                                    </Avatar>
                                )}
                            </Box>
                        ))}

                        {loading && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    padding: 2,
                                    animation: `${fadeIn} 0.3s ease-out`,
                                    gap: 1,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                    <CircularProgress size={40} sx={{ color: '#00b8d4' }} />
                                </Box>
                                
                                <LinearProgress 
                                    variant="determinate" 
                                    value={progress} 
                                    sx={{ 
                                        height: 8,

                                        borderRadius: 4,
                                        backgroundColor: 'rgba(0, 184, 212, 0.2)',
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: '#00b8d4',
                                            borderRadius: 4,
                                        }
                                    }} 
                                />
                                
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        textAlign: 'center', 
                                        color: '#555',
                                        mt: 0.5,
                                        fontStyle: 'italic',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    Processing audio... {progress}%
                                </Typography>
                                
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        textAlign: 'center', 
                                        color: '#777',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    {progress < 100 ? 'Analyzing audio patterns and identifying speakers...' : 'Finalizing results...'}
                                </Typography>
                            </Box>
                        )}

                        <div ref={messagesEndRef} />
                    </Paper>

                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1.5,
                            marginTop: 2,
                            position: 'relative',
                        }}
                    >
                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={<CloudUploadIcon />}
                            disabled={loading}
                            sx={{
                                borderRadius: '24px',
                                borderColor: loading ? 'rgba(0, 131, 143, 0.5)' : '#00838f',
                                color: loading ? 'rgba(0, 131, 143, 0.5)' : '#00838f',
                                height: '44px',
                                textTransform: 'none',
                                fontWeight: 300,
                                fontFamily: '"Segoe UI", Roboto, sans-serif',
                                fontSize: '15px',
                                boxShadow: 'none',
                                '&:hover': {
                                    borderColor: loading ? 'rgba(0, 131, 143, 0.5)' : '#006064',
                                    backgroundColor: loading ? 'transparent' : 'rgba(0, 131, 143, 0.05)',
                                },
                            }}
                        >
                            Select File
                            <VisuallyHiddenInput
                                ref={fileInputRef}
                                type="file"
                                accept=".mp3,.wav"
                                onChange={handleFileChange}
                                disabled={loading}
                            />
                        </Button>


                        <Button
                            variant="contained"
                            onClick={handleUpload}
                            disabled={!file || loading}
                            endIcon={<SendIcon />}
                            sx={{
                                flexGrow: 1,
                                height: '44px',
                                borderRadius: '24px',
                                backgroundColor: !file || loading ? 'rgba(38, 198, 218, 0.6)' : '#26c6da',
                                '&:hover': {
                                    backgroundColor: !file || loading ? 'rgba(38, 198, 218, 0.6)' : '#00acc1',
                                },
                                transition: 'all 0.2s ease-in-out',
                                boxShadow: 'none',
                                textTransform: 'none',
                                fontWeight: 300,
                                fontSize: '15px'
                            }}
                        >
                            Analyze Audio
                        </Button>

                    </Box>

                    {file && (
                        <Box sx={{
                            mt: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 1,
                            borderRadius: 1,
                            backgroundColor: 'rgba(0, 184, 212, 0.08)',
                            border: '1px solid rgba(0, 184, 212, 0.1)',
                        }}>
                            <AudioFileIcon sx={{ color: '#00b8d4', mr: 1, fontSize: 20 }} />
                            <Typography variant="body2" sx={{ color: '#555' }}>
                                {file.name}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Container>
        </>
    );
};

export default Upload;
