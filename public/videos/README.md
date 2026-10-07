# Hero background video

- `hero-background.mp4`  -> the looping hero video (served at `/videos/hero-background.mp4`)
- `hero-poster.jpg`      -> fallback image shown until the video plays / if it fails

Source footage: Mixkit "Cables in a server room" (https://mixkit.co/free-stock-video/server-room/,
Mixkit Free License: free for commercial use, no attribution required).
Processed with ffmpeg: 8 s trimmed, desaturated + faint lime tint, forward+reverse seamless loop,
1280x720, 24 fps, no audio, H.264 (~0.9 MB).

To replace it with your own clip, overwrite `hero-background.mp4` (keep it < ~3 MB, no audio):

    ffmpeg -i source.mp4 -an -vf "scale=1280:-2,fps=24" -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart hero-background.mp4

The site loads it only on desktop (>768px), not with reduced-motion or data-saver, and pauses it
when the hero is off-screen. If it fails, the black theme + poster stay visible.
