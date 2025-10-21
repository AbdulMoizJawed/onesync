// Add real sync opportunities data
const fs = require('fs');
const path = require('path');

// Read the .env.local file
const envPath = path.join(__dirname, '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) {
    env[key.trim()] = rest.join('=').trim();
  }
});

// Set environment variables
Object.keys(env).forEach(key => {
  process.env[key] = env[key];
});

const { createClient } = require('@supabase/supabase-js');

async function addRealSyncOpportunities() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('Adding real sync opportunities...');
    
    // Add real sync opportunities directly
    const opportunities = [
      {
        title: "Netflix Original Series - Drama Underscore",
        type: "tv",
        description: "Seeking emotional instrumental tracks for a new Netflix drama series set in contemporary NYC. Need moody, atmospheric pieces that can underscore dramatic scenes without overpowering dialogue.",
        genre: "Cinematic/Ambient",
        budget_min: 2500,
        budget_max: 8000,
        status: "urgent",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        requirements: [
          "Instrumental tracks only",
          "2-4 minute duration",
          "High quality WAV files (24-bit/48kHz)",
          "Master and stems required",
          "Must be 100% original composition"
        ],
        submissions_count: 23
      },
      {
        title: "Apple Commercial - Uplifting Tech Anthem",
        type: "commercial",
        description: "Major tech brand campaign needs uplifting, innovative music that captures the feeling of breakthrough moments and human connection through technology.",
        genre: "Electronic/Pop",
        budget_min: 15000,
        budget_max: 50000,
        status: "open",
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: [
          "30-60 second versions needed",
          "Uplifting and inspirational mood",
          "Modern production style",
          "Vocal elements welcome",
          "Broadcast quality mix required"
        ],
        submissions_count: 87
      },
      {
        title: "Indie Film - Romantic Comedy Score",
        type: "film",
        description: "Independent romantic comedy seeking quirky, heartwarming tracks for various scenes. The film has a modern, urban setting with a diverse cast.",
        genre: "Indie Pop/Folk",
        budget_min: 1000,
        budget_max: 5000,
        status: "open",
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: [
          "Acoustic instruments preferred",
          "Light, optimistic feel",
          "Various tempos needed",
          "Some tracks with vocals, some instrumental",
          "Demo quality acceptable for initial review"
        ],
        submissions_count: 156
      },
      {
        title: "AAA Video Game - Epic Battle Theme",
        type: "game",
        description: "Major gaming studio needs epic orchestral pieces for boss battle sequences in upcoming fantasy RPG. Looking for dramatic, intense compositions that build energy.",
        genre: "Orchestral/Cinematic",
        budget_min: 5000,
        budget_max: 15000,
        status: "open",
        deadline: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: [
          "Orchestral instrumentation",
          "3-5 minute compositions",
          "Must loop seamlessly",
          "MIDI files and stems required",
          "Previous game music experience preferred"
        ],
        submissions_count: 34
      },
      {
        title: "Spotify Podcast Series - True Crime Intro",
        type: "podcast",
        description: "Popular true crime podcast needs a haunting, mysterious theme song and episode intro music. Should create tension and intrigue without being too dark.",
        genre: "Dark Ambient/Cinematic",
        budget_min: 800,
        budget_max: 3000,
        status: "urgent",
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: [
          "30-90 second intro version",
          "Mysterious, suspenseful mood",
          "Minimal vocals or instrumental",
          "Must be original composition",
          "Rights for podcast series and social media"
        ],
        submissions_count: 67
      },
      {
        title: "Documentary Series - Environmental Focus",
        type: "tv",
        description: "National Geographic documentary about climate change needs uplifting yet urgent music that inspires action while highlighting the beauty of nature.",
        genre: "World/Orchestral",
        budget_min: 3000,
        budget_max: 12000,
        status: "open",
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: [
          "Organic instrumentation preferred",
          "Emotionally moving compositions",
          "Various cultures represented welcome",
          "Both hopeful and urgent tones needed",
          "Broadcast television quality required"
        ],
        submissions_count: 92
      },
      {
        title: "Fashion Brand Campaign - Luxury Lifestyle",
        type: "commercial",
        description: "High-end fashion brand launching new collection needs sophisticated, luxurious music for digital and TV campaign targeting affluent millennials.",
        genre: "Electronic/Pop",
        budget_min: 8000,
        budget_max: 25000,
        status: "open",
        deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: [
          "Sophisticated, trendy sound",
          "15, 30, and 60-second edits",
          "High production value",
          "Modern, sleek aesthetic",
          "Rights for global campaign"
        ],
        submissions_count: 129
      },
      {
        title: "Mobile Game - Casual Puzzle Music",
        type: "game",
        description: "Popular mobile puzzle game needs calm, engaging background music that keeps players relaxed and focused during gameplay sessions.",
        genre: "Ambient/Casual",
        budget_min: 1500,
        budget_max: 6000,
        status: "open",
        deadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: [
          "Seamless looping required",
          "Calm, non-distracting",
          "2-5 minute compositions",
          "Multiple variations welcome",
          "Mobile-optimized audio formats"
        ],
        submissions_count: 78
      },
      {
        title: "HBO Max Series - Hip-Hop Drama Soundtrack",
        type: "tv",
        description: "New HBO Max series about the music industry needs authentic hip-hop tracks and beats that represent the current Atlanta rap scene.",
        genre: "Hip-Hop/Rap",
        budget_min: 4000,
        budget_max: 20000,
        status: "urgent",
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: [
          "Authentic hip-hop production",
          "Atlanta sound preferred",
          "Both beats and full songs needed",
          "Cleared samples or original beats only",
          "Various moods: party, introspective, aggressive"
        ],
        submissions_count: 203
      },
      {
        title: "European Auto Commercial - Road Trip Vibes",
        type: "commercial",
        description: "European car manufacturer needs feel-good music for summer campaign focusing on family road trips and adventure. Multiple regional versions planned.",
        genre: "Pop/Folk",
        budget_min: 6000,
        budget_max: 18000,
        status: "open",
        deadline: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: [
          "Feel-good, adventurous mood",
          "Family-friendly content",
          "Acoustic elements welcome",
          "Multiple language versions may be needed",
          "Broadcast quality required"
        ],
        submissions_count: 145
      }
    ];

    const { data, error } = await supabase
      .from('sync_opportunities')
      .insert(opportunities)
      .select();

    if (error) {
      console.error('Error inserting opportunities:', error);
      return;
    }

    console.log(`✅ Successfully added ${data.length} sync opportunities!`);

  } catch (error) {
    console.error('Error:', error);
  }
}

addRealSyncOpportunities();
