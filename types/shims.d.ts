declare module '@/components/ui/slider' {
  export const Slider: any
}

declare module '@/components/ui/separator' {
  export const Separator: any
}

declare module '@/hooks/use-hybrid-storage' {
  export function useHybridStorage(...args: any[]): any
  export type UploadedFile = any
  export type UploadProgress = any
}

declare module '@/lib/hybrid-upload' {
  export function uploadReleaseHybrid(...args: any[]): Promise<any>
  export function saveDraftHybrid(...args: any[]): Promise<any>
  export type ReleaseUploadData = any
}
