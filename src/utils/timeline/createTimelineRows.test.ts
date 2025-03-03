import { describe, it, expect } from 'vitest';
import { createTimelineRows } from './createTimelineRows';
import { SubtitleCue } from './types';

describe('createTimelineRows', () => {
  // Default test config
  const config = { barWidth: 10, pointsPerRow: 100, msPerPoint: 100 };

  it('should return empty array when no waveform data is provided', () => {
    const result = createTimelineRows(undefined, undefined, config);
    expect(result).toEqual([]);
  });

  it('should create rows based on waveform data without subtitles', () => {
    // Create a waveform with 250 points (should create 3 rows)
    const waveform = Array(250).fill(0.5);
    
    const result = createTimelineRows(waveform, undefined, config);
    
    expect(result.length).toBe(3);
    
    // Verify first row
    expect(result[0].startPoint).toBe(0);
    expect(result[0].pointCount).toBe(100);
    expect(result[0].startTime).toBe(0);
    expect(result[0].endTime).toBe(10000); // 100 points * 100ms
    expect(result[0].width).toBe(1000); // 100 points * 10px
    expect(result[0].subtitles).toEqual([]);
    
    // Verify second row
    expect(result[1].startPoint).toBe(100);
    expect(result[1].pointCount).toBe(100);
    expect(result[1].startTime).toBe(10000);
    expect(result[1].endTime).toBe(20000);
    
    // Verify third row (partial)
    expect(result[2].startPoint).toBe(200);
    expect(result[2].pointCount).toBe(50);
    expect(result[2].startTime).toBe(20000);
    expect(result[2].endTime).toBe(25000);
    expect(result[2].width).toBe(500); // 50 points * 10px
  });

  it('should assign subtitles to correct rows based on start time', () => {
    const waveform = Array(200).fill(0.5);
    const subtitles: SubtitleCue[] = [
      { id: '1', start: 5000, end: 8000, text: 'Subtitle in first row' },
      { id: '2', start: 12000, end: 15000, text: 'Subtitle in second row' },
      { id: '3', start: 9000, end: 16000, text: 'Subtitle that starts in first row but ends in second' },
    ];
    
    const result = createTimelineRows(waveform, subtitles, config);
    
    // Should have 2 rows
    expect(result.length).toBe(2);
    
    // First row should have 2 subtitles (id 1 and 3)
    expect(result[0].subtitles.length).toBe(2);
    expect(result[0].subtitles[0].id).toBe('1');
    expect(result[0].subtitles[1].id).toBe('3');
    
    // Verify subtitle positioning in first row
    expect(result[0].subtitles[0].startOffsetInRow).toBe(500); // 5000ms / 100ms * 10px
    expect(result[0].subtitles[0].width).toBe(300); // (8000-5000)ms / 100ms * 10px
    
    // Second row should have 1 subtitle (id 2)
    expect(result[1].subtitles.length).toBe(1);
    expect(result[1].subtitles[0].id).toBe('2');
    
    // Verify subtitle positioning in second row
    expect(result[1].subtitles[0].startOffsetInRow).toBe(200); // (12000-10000)ms / 100ms * 10px
    expect(result[1].subtitles[0].width).toBe(300); // (15000-12000)ms / 100ms * 10px
  });

  it('should handle subtitles that start before timeline', () => {
    const waveform = Array(100).fill(0.5);
    const subtitles: SubtitleCue[] = [
      { id: '1', start: -2000, end: 3000, text: 'Starts before timeline' },
      { id: '2', start: -5000, end: -1000, text: 'Completely before timeline' },
    ];
    
    const result = createTimelineRows(waveform, subtitles, config);
    
    // Should have 1 row
    expect(result.length).toBe(1);
    
    // First row should have 1 subtitle (id 1)
    expect(result[0].subtitles.length).toBe(1);
    expect(result[0].subtitles[0].id).toBe('1');
    
    // Subtitle should be positioned at the start of the row
    expect(result[0].subtitles[0].startOffsetInRow).toBe(0);
    expect(result[0].subtitles[0].width).toBe(500); // (3000-(-2000))ms / 100ms * 10px
  });

  it('should handle long subtitles that exceed row width', () => {
    const waveform = Array(200).fill(0.5);
    const subtitles: SubtitleCue[] = [
      { id: '1', start: 5000, end: 25000, text: 'Very long subtitle that spans multiple rows' },
    ];
    
    const result = createTimelineRows(waveform, subtitles, config);
    
    // Should have 2 rows
    expect(result.length).toBe(2);
    
    // First row should have the subtitle
    expect(result[0].subtitles.length).toBe(1);
    expect(result[0].subtitles[0].width).toBe(2000); // (25000-5000)ms / 100ms * 10px
    
    // Second row should have no subtitles
    expect(result[1].subtitles.length).toBe(0);
  });
});