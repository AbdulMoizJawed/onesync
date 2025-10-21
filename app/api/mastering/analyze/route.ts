import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { roexClient } from '@/lib/roex-api';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId, fileUrl, musicalStyle, isMaster } = await request.json();

    if (!fileUrl || !musicalStyle) {
      return NextResponse.json({ error: 'File URL and musical style required' }, { status: 400 });
    }

    // Run mix analysis - convert to File object for our placeholder implementation
    const mockFile = new File([], 'placeholder.wav', { type: 'audio/wav' })
    const analysisResults = await roexClient.analyzeMix(mockFile)

    // Mock payload data for database insertion
    const mockPayload = {
      bit_depth: 24,
      sample_rate: 44100,
      integrated_loudness_lufs: analysisResults.loudness.integrated,
      peak_loudness_dbfs: analysisResults.loudness.peak,
      clipping: false,
      phase_issues: false,
      mono_compatible: true,
      stereo_field: analysisResults.stereo.width,
      if_mix_loudness: 'optimal',
      if_mix_drc: 'good',
      if_master_loudness: 'optimal',
      if_master_drc: 'good',
      tonal_profile: {
        bass_frequency: analysisResults.frequency.bass,
        low_mid_frequency: analysisResults.frequency.mids,
        high_mid_frequency: analysisResults.frequency.mids,
        high_frequency: analysisResults.frequency.treble
      }
    }

    // Save analysis results to database
    const { data: analysis, error: dbError } = await supabase
      .from('mix_analysis_results')
      .insert({
        mastering_job_id: jobId || null,
        user_id: user.id,
        audio_file_url: fileUrl,
        musical_style: musicalStyle,
        is_master: isMaster || false,
        
        // Technical data
        bit_depth: mockPayload.bit_depth,
        sample_rate: mockPayload.sample_rate,
        integrated_loudness_lufs: mockPayload.integrated_loudness_lufs,
        peak_loudness_dbfs: mockPayload.peak_loudness_dbfs,
        
        // Quality metrics
        clipping: mockPayload.clipping,
        phase_issues: mockPayload.phase_issues,
        mono_compatible: mockPayload.mono_compatible,
        stereo_field: mockPayload.stereo_field,
        
        // Recommendations
        if_mix_loudness: mockPayload.if_mix_loudness,
        if_mix_drc: mockPayload.if_mix_drc,
        if_master_loudness: mockPayload.if_master_loudness,
        if_master_drc: mockPayload.if_master_drc,
        
        // Tonal profile
        tonal_bass: mockPayload.tonal_profile.bass_frequency,
        tonal_low_mid: mockPayload.tonal_profile.low_mid_frequency,
        tonal_high_mid: mockPayload.tonal_profile.high_mid_frequency,
        tonal_high: mockPayload.tonal_profile.high_frequency,
        
        // Complete data
        full_analysis_data: analysisResults
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error saving analysis:', dbError);
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
    }

    // If this analysis is for a mastering job, update the job
    if (jobId) {
      await supabase
        .from('mastering_jobs')
        .update({
          analysis_completed: true,
          analysis_results: analysisResults
        })
        .eq('id', jobId);
    }

    return NextResponse.json({ 
      success: true,
      analysis: analysis,
      results: analysisResults
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
