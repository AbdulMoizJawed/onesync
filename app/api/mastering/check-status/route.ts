import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { roexClient } from '@/lib/roex-api';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    // Get job from database
    const { data: job, error: dbError } = await supabase
      .from('mastering_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (dbError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // If job doesn't have a RoEx task ID yet, return current status
    if (!job.roex_task_id || job.status === 'uploading') {
      return NextResponse.json({ 
        job,
        needsUpdate: false 
      });
    }

    let updatedJob = { ...job };
    let needsUpdate = false;

    try {
      // Check if preview is ready
      if (job.status === 'processing_preview') {
        try {
          const previewResponse = await roexClient.retrievePreviewMaster(job.roex_task_id);
          
          if (!previewResponse.error && previewResponse.previewMasterTaskResults) {
            // Preview is ready
            const { data: updateData, error: updateError } = await supabase
              .from('mastering_jobs')
              .update({
                status: 'preview_ready',
                preview_url: previewResponse.previewMasterTaskResults.download_url_mastered_preview,
                preview_start_time: previewResponse.previewMasterTaskResults.preview_start_time,
                progress: 75
              })
              .eq('id', jobId)
              .select()
              .single();

            if (!updateError && updateData) {
              updatedJob = updateData;
              needsUpdate = true;
            }
          }
        } catch (previewError) {
          // Preview not ready yet, continue checking
          console.log('Preview not ready yet:', previewError);
        }
      }

      // If we have a preview and user wants final master
      if (job.status === 'preview_ready' || job.status === 'processing_final') {
        try {
          const finalResponse = await roexClient.retrieveFullMaster(job.roex_task_id);
          
          if (finalResponse.fullMasterTaskResults) {
            // Final master is ready
            const { data: updateData, error: updateError } = await supabase
              .from('mastering_jobs')
              .update({
                status: 'completed',
                mastered_file_url: finalResponse.fullMasterTaskResults.download_url_mastered_full,
                progress: 100
              })
              .eq('id', jobId)
              .select()
              .single();

            if (!updateError && updateData) {
              updatedJob = updateData;
              needsUpdate = true;
            }
          }
        } catch (finalError) {
          // Final not ready yet
          console.log('Final master not ready yet:', finalError);
          
          // If job is still in preview_ready, don't change status
          // If job is processing_final, keep it that way
          if (job.status === 'preview_ready') {
            // Update to processing_final if user requested it
            const { data: updateData, error: updateError } = await supabase
              .from('mastering_jobs')
              .update({
                status: 'processing_final',
                progress: 85
              })
              .eq('id', jobId)
              .select()
              .single();

            if (!updateError && updateData) {
              updatedJob = updateData;
              needsUpdate = true;
            }
          }
        }
      }

    } catch (error) {
      console.error('Error checking mastering status:', error);
      
      // Don't fail the request, just return current job status
      // The client can retry later
      console.log('Will retry status check later');
    }

    return NextResponse.json({ 
      job: updatedJob,
      needsUpdate 
    });

  } catch (error) {
    console.error('General error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
