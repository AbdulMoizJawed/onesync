// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { Album, Favorite, FavoriteBorder, SkipPrevious, SkipNext, Pause, PlayArrow, VolumeUp, Analytics } from '@mui/icons-material';
import { TrophyOutlined, CrownOutlined, ShareAltOutlined, DownloadOutlined, StarOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button as MuiButton, 
  TextField, 
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Divider
} from '@mui/material';
import { 
  Button as AntButton, 
  Progress, 
  Slider, 
  Tag, 
  Rate, 
  Space, 
  Tooltip,
  Badge,
  Statistic,
  Row,
  Col,
  Avatar as AntAvatar
} from 'antd';
import { PremiumIcons, MusicPlayerIcons, ExecutiveIcons, AnalyticsIcons } from '@/lib/icons';
import { motion } from 'framer-motion';

export function CustomUIShowcase() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [volume, setVolume] = useState(85);
  const [progress, setProgress] = useState(67);
  const [rating, setRating] = useState(4.8);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 2,
              fontFamily: '"Montserrat", sans-serif',
              background: 'linear-gradient(135deg, #e11d48 0%, #d946ef 50%, #06b6d4 100%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2
            }}
          >
            <PremiumIcons.crown size={48} weight="fill" color="#e11d48" />
            Executive Music Empire
            <PremiumIcons.diamond size={48} weight="fill" color="#d946ef" />
          </Typography>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: 'text.secondary',
              fontFamily: '"Inter", sans-serif',
              maxWidth: 700,
              mx: 'auto',
              fontSize: '1.2rem'
            }}
          >
            Ultra-premium platform designed for platinum artists, industry executives, and music royalty
          </Typography>
        </motion.div>
      </Box>
      
      <Row gutter={[32, 32]}>
        {/* Premium Music Player - Material UI */}
        <Col xs={24} lg={14}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Album sx={{ mr: 2, color: 'primary.main' }} />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontFamily: '"Montserrat", sans-serif',
                    fontWeight: 600
                  }}
                >
                  Premium Audio Player
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    mr: 3,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    fontSize: '2rem'
                  }}
                >
                  🎵
                </Avatar> 
                <Box sx={{ flexGrow: 1 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontFamily: '"Montserrat", sans-serif',
                      fontWeight: 600,
                      mb: 0.5
                    }}
                  >
                    "Platinum Dreams"
                  </Typography>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: 'text.secondary',
                      fontFamily: '"Inter", sans-serif',
                      mb: 1
                    }}
                  >
                    Executive Producer Mix
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      label="Platinum" 
                      size="small" 
                      icon={<TrophyOutlined />}
                      sx={{ 
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                    <Chip label="Executive Mix" size="small" />
                  </Box>
                </Box>
                <IconButton 
                  onClick={() => setIsFavorited(!isFavorited)}
                  sx={{ 
                    background: isFavorited ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'transparent',
                    '&:hover': { 
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isFavorited ? <Favorite sx={{ color: 'white' }} /> : <FavoriteBorder />}
                </IconButton>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>2:14</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>3:47</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    background: 'rgba(99, 102, 241, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      borderRadius: 4
                    }
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton sx={{ '&:hover': { transform: 'scale(1.1)' } }}>
                  <SkipPrevious />
                </IconButton>
                <IconButton 
                  onClick={() => setIsPlaying(!isPlaying)}
                  sx={{ 
                    width: 64,
                    height: 64,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    '&:hover': { 
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isPlaying ? <Pause sx={{ fontSize: 32 }} /> : <PlayArrow sx={{ fontSize: 32 }} />}
                </IconButton>
                <IconButton sx={{ '&:hover': { transform: 'scale(1.1)' } }}>
                  <SkipNext />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <VolumeUp sx={{ color: 'text.secondary' }} />
                <Slider 
                  value={volume} 
                  onChange={(value) => setVolume(value as number)}
                  sx={{ 
                    flexGrow: 1,
                    '& .MuiSlider-thumb': {
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    },
                    '& .MuiSlider-track': {
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    }
                  }}
                />
                <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 32 }}>
                  {volume}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Col>

        {/* Executive Dashboard - Ant Design */}
        <Col xs={24} lg={10}>
          <Card style={{ height: '100%', padding: '24px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Analytics sx={{ mr: 2, color: 'primary.main' }} />
              <Typography 
                variant="h5" 
                sx={{ 
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 600
                }}
              >
                Executive Analytics
              </Typography>
            </Box>

            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Row gutter={24}>
                <Col span={12}>
                  <Statistic 
                    title="Global Streams" 
                    value={2847293} 
                    valueStyle={{ 
                      color: '#6366f1',
                      fontFamily: '"Montserrat", sans-serif',
                      fontWeight: 600
                    }}
                    prefix={<CrownOutlined style={{ color: '#f59e0b' }} />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="Revenue" 
                    value={187420}
                    precision={2}
                    prefix="$"
                    valueStyle={{ 
                      color: '#10b981',
                      fontFamily: '"Montserrat", sans-serif',
                      fontWeight: 600
                    }}
                  />
                </Col>
              </Row>

              <Divider />

              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: 2,
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 600,
                    color: 'text.primary'
                  }}
                >
                  Platinum Track Performance
                </Typography>
                <Progress 
                  percent={progress} 
                  strokeColor={{
                    '0%': '#6366f1',
                    '100%': '#8b5cf6',
                  }}
                  trailColor="rgba(99, 102, 241, 0.2)"
                  strokeWidth={12}
                  style={{ marginBottom: 16 }}
                />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  67% above industry average
                </Typography>
              </Box>

              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: 2,
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 600
                  }}
                >
                  Industry Rating
                </Typography>
                <Rate 
                  value={rating} 
                  onChange={setRating} 
                  allowHalf 
                  style={{ color: '#f59e0b', fontSize: '20px' }}
                />
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  Rated by 1,247 industry professionals
                </Typography>
              </Box>

              <Space wrap size="middle">
                <Badge count="NEW" style={{ backgroundColor: '#6366f1' }}>
                  <AntButton 
                    icon={<TrophyOutlined />}
                    type="primary"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      border: 'none',
                      fontWeight: 600
                    }}
                  >
                    Awards
                  </AntButton>
                </Badge>
                <AntButton 
                  icon={<ShareAltOutlined />}
                  style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: '#6366f1',
                    fontWeight: 600
                  }}
                >
                  Share Analytics
                </AntButton>
                <AntButton 
                  icon={<DownloadOutlined />}
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    fontWeight: 600
                  }}
                >
                  Export Report
                </AntButton>
              </Space>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Tag 
                  color="#6366f1" 
                  style={{ 
                    background: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '16px',
                    padding: '4px 12px',
                    fontWeight: 600
                  }}
                >
                  <StarOutlined /> Platinum
                </Tag>
                <Tag 
                  color="#f59e0b"
                  style={{ 
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '16px',
                    padding: '4px 12px',
                    fontWeight: 600
                  }}
                >
                  Executive Mix
                </Tag>
                <Tag 
                  color="#10b981"
                  style={{ 
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '16px',
                    padding: '4px 12px',
                    fontWeight: 600
                  }}
                >
                  Top Performer
                </Tag>
              </Box>
            </Space>
          </Card>
        </Col>

        {/* Action Buttons */}
        <Col xs={24}>
          <Card sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>
              🚀 Ready to Create Something Amazing?
            </Typography>
            <Space size="large" wrap>
              <MuiButton 
                variant="contained" 
                size="large"
                sx={{ 
                  background: 'linear-gradient(45deg, #1db954 30%, #1ed760 90%)',
                  px: 4,
                  py: 1.5
                }}
              >
                Upload New Track
              </MuiButton>
              <AntButton 
                type="primary" 
                size="large" 
                icon={<PlayCircleOutlined />}
                style={{ 
                  background: 'linear-gradient(45deg, #ff6b35 30%, #ff8a65 90%)',
                  border: 'none',
                  height: 'auto',
                  padding: '12px 32px'
                }}
              >
                Start Streaming
              </AntButton>
            </Space>
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Your music deserves a custom, professional platform. 
                No more cookie-cutter designs! 🎨
              </Typography>
            </Box>
          </Card>
        </Col>
      </Row>
    </Box>
  );
}
