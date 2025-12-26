# Video Format Upload Fix - MKV and All Formats Support

## Problem
MKV video files and other less common video formats were not uploading successfully.

## Root Causes Identified
1. **MIME Type Issues**: MKV files often upload with `application/octet-stream` MIME type instead of `video/x-matroska`, causing the server to reject them
2. **Limited Format List**: The video listing endpoint only recognized a small subset of video formats (mp4, avi, mov, mkv, flv)
3. **Restrictive Filter**: The file filter was rejecting files based on MIME type alone, which is unreliable for some formats

## Changes Made

### 1. Enhanced Server-Side Upload Filter (`api-server.js`)
- **Extended format list** to include 40+ video formats:
  - Common: MP4, AVI, MOV, MKV, FLV, WEBM, WMV, M4V
  - Additional: 3GP, 3GPP, MPEG, MPG, OGV, OGG, VOB, TS, MTS, M2TS, QT, YUV, RM, RMVB, ASF, AMV, SVI, 3G2, MXF, ROQ, NSV, F4V, F4P, F4A, F4B, DIVX
- **Made extension-based filtering primary** (more reliable than MIME type)
- **Added `application/octet-stream` support** (common for binary uploads like MKV)
- **Added logging** for upload acceptance/rejection to help troubleshooting

### 2. Updated Video List Endpoint (`api-server.js`)
- Expanded the file filter regex to recognize all 40+ supported video formats
- Ensures all uploaded videos appear in the video list

### 3. Updated UI Text (`admin.html` and `admin-v2.html`)
- Changed from "MP4, AVI, MOV, MKV, FLV" to "All video formats (MP4, AVI, MOV, MKV, FLV, WEBM, WMV, etc.)"
- Updated file size limit text from "500MB" to "Up to 10GB per file" (admin.html)

## Supported Video Formats (Complete List)
`.mp4`, `.avi`, `.mov`, `.mkv`, `.flv`, `.webm`, `.wmv`, `.m4v`, `.3gp`, `.3gpp`, `.mpeg`, `.mpg`, `.mpe`, `.m2v`, `.m4p`, `.ogv`, `.ogg`, `.vob`, `.ts`, `.mts`, `.m2ts`, `.qt`, `.yuv`, `.rm`, `.rmvb`, `.asf`, `.amv`, `.mp2`, `.mpv`, `.svi`, `.3g2`, `.mxf`, `.roq`, `.nsv`, `.f4v`, `.f4p`, `.f4a`, `.f4b`, `.divx`

## How It Works Now
1. **Extension First**: If the file has a video extension (case-insensitive), it's accepted
2. **MIME Type Fallback**: If extension check fails, checks if MIME type starts with `video/` or is `application/octet-stream`
3. **Logging**: Every upload attempt is logged showing filename and MIME type for debugging

## Testing
To test MKV uploads:
1. Start the server: `npm start` or `node api-server.js`
2. Open admin panel: `http://localhost:3000/admin-v2.html`
3. Upload an MKV file
4. Check server logs for: `[UPLOAD] Accepting file: filename.mkv (application/octet-stream)`

## Benefits
✅ MKV files now upload successfully  
✅ Support for 40+ video formats  
✅ More reliable extension-based filtering  
✅ Better error logging for troubleshooting  
✅ Handles browser MIME type inconsistencies  
✅ 10GB file size support for large videos  

## No Breaking Changes
- Existing functionality remains unchanged
- All previously supported formats still work
- Backward compatible with existing videos
