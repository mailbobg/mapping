#!/usr/bin/env python3
"""
Structural Clarity - Visual Canvas Generator
A design artifact expressing systematic visual intelligence for OCCluster
Second pass: Refined for museum-quality precision
"""

from reportlab.lib.pagesizes import A3
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import math
import os

# Register fonts
FONT_DIR = "/Users/bobmax/.claude/skills/canvas-design/canvas-fonts"
pdfmetrics.registerFont(TTFont('GeistMono', os.path.join(FONT_DIR, 'GeistMono-Regular.ttf')))
pdfmetrics.registerFont(TTFont('GeistMono-Bold', os.path.join(FONT_DIR, 'GeistMono-Bold.ttf')))
pdfmetrics.registerFont(TTFont('InstrumentSans', os.path.join(FONT_DIR, 'InstrumentSans-Regular.ttf')))
pdfmetrics.registerFont(TTFont('InstrumentSans-Bold', os.path.join(FONT_DIR, 'InstrumentSans-Bold.ttf')))
pdfmetrics.registerFont(TTFont('Jura-Light', os.path.join(FONT_DIR, 'Jura-Light.ttf')))
pdfmetrics.registerFont(TTFont('Jura-Medium', os.path.join(FONT_DIR, 'Jura-Medium.ttf')))
pdfmetrics.registerFont(TTFont('WorkSans', os.path.join(FONT_DIR, 'WorkSans-Regular.ttf')))
pdfmetrics.registerFont(TTFont('WorkSans-Bold', os.path.join(FONT_DIR, 'WorkSans-Bold.ttf')))

# Color Palette - Structural Clarity (Refined)
# More subtle, more cohesive - museum quality
COLORS = {
    'bg_primary': Color(0.992, 0.992, 0.996),      # Pure white with warmth #FDFDFE
    'bg_secondary': Color(0.969, 0.973, 0.980),    # Soft cool gray #F7F8FA
    'bg_tertiary': Color(0.941, 0.949, 0.961),     # Refined slate #F0F2F5
    'text_primary': Color(0.106, 0.145, 0.200),    # Deep ink #1B2533
    'text_secondary': Color(0.290, 0.345, 0.416),  # Balanced slate #4A586A
    'text_muted': Color(0.545, 0.600, 0.678),      # Soft medium #8B99AD
    'border': Color(0.875, 0.898, 0.925),          # Crisp border #DFE5EC
    'accent': Color(0.027, 0.588, 0.847),          # Refined cyan #07968D -> changed to #0796D8
    'accent_soft': Color(0.027, 0.588, 0.847, 0.08),  # Accent at 8% opacity
    'accent_light': Color(0.898, 0.957, 0.992),    # Whisper cyan #E5F4FD
    'success': Color(0.082, 0.682, 0.478),         # Refined emerald #15AE7A
    'success_light': Color(0.871, 0.973, 0.925),   # Soft emerald #DEF8EC
    'grid_line': Color(0.925, 0.937, 0.949),       # Barely visible grid #ECF0F2
    'amber': Color(0.922, 0.584, 0.090),           # Warm amber #EB9517
    'amber_light': Color(0.996, 0.961, 0.906),     # Soft amber #FEF5E7
}

def draw_structural_clarity_canvas(output_path):
    """Generate the Structural Clarity design canvas - refined second pass."""
    
    # A3 landscape for expansive composition
    width, height = A3[1], A3[0]  # Landscape
    c = canvas.Canvas(output_path, pagesize=(width, height))
    
    # === BACKGROUND LAYER ===
    c.setFillColor(COLORS['bg_primary'])
    c.rect(0, 0, width, height, fill=1, stroke=0)
    
    # Subtle grid pattern - reduced visibility for refinement
    c.setStrokeColor(COLORS['grid_line'])
    c.setLineWidth(0.15)  # Thinner for subtlety
    grid_size = 10 * mm  # Larger grid for cleaner look
    for x in range(0, int(width), int(grid_size)):
        c.line(x, 0, x, height)
    for y in range(0, int(height), int(grid_size)):
        c.line(0, y, width, y)
    
    # === COMPOSITION ZONES ===
    margin = 30 * mm  # Increased margin for breathing room
    content_width = width - 2 * margin
    content_height = height - 2 * margin
    
    # Golden ratio divisions
    phi = 1.618033988749
    left_zone_width = content_width / phi
    right_zone_width = content_width - left_zone_width
    
    # === LEFT ZONE: Data Architecture Visualization ===
    
    # Large structural frame
    frame_x = margin
    frame_y = margin + 25 * mm
    frame_w = left_zone_width - 25 * mm
    frame_h = content_height - 50 * mm
    
    # Outer frame with refined border
    c.setStrokeColor(COLORS['border'])
    c.setLineWidth(0.35)
    c.roundRect(frame_x, frame_y, frame_w, frame_h, 4*mm, fill=0, stroke=1)
    
    # Inner structure - hierarchical data blocks
    block_margin = 15 * mm
    inner_x = frame_x + block_margin
    inner_y = frame_y + block_margin
    inner_w = frame_w - 2 * block_margin
    inner_h = frame_h - 2 * block_margin
    
    # Hierarchy levels with refined spacing
    levels = [
        # (label, count, height_ratio, colors)
        ('DOMAIN', 1, 0.18, [COLORS['accent_light']]),
        ('FEATURE', 3, 0.22, [COLORS['bg_tertiary']]),
        ('PRODUCT FUNCTION', 5, 0.28, [COLORS['bg_secondary']]),
        ('TECHNICAL FUNCTION', 8, 0.32, None),  # Special handling
    ]
    
    # Calculate cumulative heights
    current_y = inner_y
    level_positions = []
    
    for idx, (label, count, h_ratio, _) in enumerate(levels):
        level_h = inner_h * h_ratio
        level_positions.append((current_y, level_h, label, count))
        current_y += level_h
    
    # Draw levels from bottom to top (reverse order for visual hierarchy)
    for level_idx, (ly, lh, label, count) in enumerate(level_positions):
        row_padding = 5 * mm
        block_gap = 5 * mm
        block_h = lh - 2 * row_padding
        
        if count == 1:
            # Domain level - single prominent block
            c.setFillColor(COLORS['accent_light'])
            c.roundRect(inner_x, ly + row_padding, inner_w, block_h, 3*mm, fill=1, stroke=0)
            
            # Left accent bar
            c.setFillColor(COLORS['accent'])
            c.roundRect(inner_x, ly + row_padding, 4*mm, block_h, 2*mm, fill=1, stroke=0)
            
            # Label - centered vertically
            c.setFillColor(COLORS['text_secondary'])
            c.setFont('GeistMono', 8)
            c.drawString(inner_x + 12*mm, ly + row_padding + block_h/2 - 2*mm, 'CLUSTER.DOMAIN')
            
            # Right side - count indicator
            c.setFillColor(COLORS['accent'])
            c.setFont('GeistMono', 7)
            c.drawRightString(inner_x + inner_w - 8*mm, ly + row_padding + block_h/2 - 2*mm, '01')
            
        elif count == 3:
            # Feature level
            block_w = (inner_w - (count - 1) * block_gap) / count
            progress_vals = [0.92, 0.67, 0.41]
            
            for j in range(count):
                bx = inner_x + j * (block_w + block_gap)
                
                c.setFillColor(COLORS['bg_tertiary'])
                c.roundRect(bx, ly + row_padding, block_w, block_h, 2.5*mm, fill=1, stroke=0)
                
                # Subtle border
                c.setStrokeColor(COLORS['border'])
                c.setLineWidth(0.3)
                c.roundRect(bx, ly + row_padding, block_w, block_h, 2.5*mm, fill=0, stroke=1)
                
                # Progress indicator on left
                prog = progress_vals[j]
                prog_color = COLORS['success'] if prog > 0.85 else COLORS['accent'] if prog > 0.5 else COLORS['amber']
                c.setFillColor(prog_color)
                c.roundRect(bx + 2*mm, ly + row_padding + 3*mm, 2.5*mm, (block_h - 6*mm) * prog, 1*mm, fill=1, stroke=0)
                
                # ID label
                c.setFillColor(COLORS['text_muted'])
                c.setFont('GeistMono', 6)
                c.drawString(bx + 8*mm, ly + row_padding + block_h - 8*mm, f'F-{101 + j}')
                
        elif count == 5:
            # Product Function level
            block_w = (inner_w - (count - 1) * block_gap) / count
            
            for j in range(count):
                bx = inner_x + j * (block_w + block_gap)
                
                c.setFillColor(COLORS['bg_secondary'])
                c.roundRect(bx, ly + row_padding, block_w, block_h, 2*mm, fill=1, stroke=0)
                
                c.setStrokeColor(COLORS['border'])
                c.setLineWidth(0.25)
                c.roundRect(bx, ly + row_padding, block_w, block_h, 2*mm, fill=0, stroke=1)
                
                # Micro ID
                c.setFillColor(COLORS['text_muted'])
                c.setFont('GeistMono', 5)
                c.drawCentredString(bx + block_w/2, ly + row_padding + block_h/2 - 1.5*mm, f'PF-{1001 + j}')
                
        else:
            # Technical Function level - 8 blocks with state indicators
            block_w = (inner_w - (count - 1) * block_gap) / count
            states = [
                (COLORS['success_light'], COLORS['success']),      # Complete
                (COLORS['success_light'], COLORS['success']),      # Complete
                (COLORS['accent_light'], COLORS['accent']),        # In progress
                (COLORS['success_light'], COLORS['success']),      # Complete
                (COLORS['accent_light'], COLORS['accent']),        # In progress
                (COLORS['amber_light'], COLORS['amber']),          # Warning
                (COLORS['bg_tertiary'], COLORS['border']),         # Pending
                (COLORS['bg_tertiary'], COLORS['border']),         # Pending
            ]
            
            for j in range(count):
                bx = inner_x + j * (block_w + block_gap)
                bg_color, border_color = states[j]
                
                c.setFillColor(bg_color)
                c.roundRect(bx, ly + row_padding, block_w, block_h, 1.5*mm, fill=1, stroke=0)
                
                c.setStrokeColor(border_color)
                c.setLineWidth(0.35)
                c.roundRect(bx, ly + row_padding, block_w, block_h, 1.5*mm, fill=0, stroke=1)
    
    # Connection lines between levels - elegant dashed
    c.setStrokeColor(COLORS['text_muted'])
    c.setLineWidth(0.25)
    c.setDash([1.5, 2])
    
    # Draw connecting lines between level centers
    for i in range(len(level_positions) - 1):
        ly1, lh1, _, count1 = level_positions[i]
        ly2, lh2, _, count2 = level_positions[i + 1]
        
        y_bottom = ly1 + lh1 - 5*mm
        y_top = ly2 + 5*mm
        
        # Draw lines from each block in lower level to spread across upper
        block_gap = 5 * mm
        for j in range(min(count1, 3)):
            block_w1 = (inner_w - (count1 - 1) * block_gap) / count1
            cx = inner_x + j * (block_w1 + block_gap) + block_w1 / 2
            c.line(cx, y_bottom, cx, y_top)
    
    c.setDash([])
    
    # === LEVEL LABELS (outside frame) ===
    level_labels = ['DOMAIN', 'FEATURE', 'PRODUCT', 'TECHNICAL']
    for idx, (ly, lh, _, _) in enumerate(level_positions):
        c.setFillColor(COLORS['text_muted'])
        c.setFont('GeistMono', 5)
        c.saveState()
        c.translate(frame_x - 3*mm, ly + lh/2)
        c.rotate(90)
        c.drawCentredString(0, 0, level_labels[idx])
        c.restoreState()
    
    # === RIGHT ZONE: Systematic Reference ===
    
    right_x = margin + left_zone_width + 15 * mm
    right_w = right_zone_width - 15 * mm
    
    # Title area - refined typography
    c.setFillColor(COLORS['text_primary'])
    c.setFont('WorkSans', 32)
    c.drawString(right_x, height - margin - 18*mm, 'OC')
    c.setFont('WorkSans-Bold', 32)
    c.drawString(right_x + 38*mm, height - margin - 18*mm, 'Cluster')
    
    c.setFillColor(COLORS['text_muted'])
    c.setFont('GeistMono', 7)
    c.drawString(right_x, height - margin - 26*mm, 'FUNCTION STRUCTURE SYSTEM')
    
    # Refined accent line
    c.setStrokeColor(COLORS['accent'])
    c.setLineWidth(1.5)
    c.line(right_x, height - margin - 32*mm, right_x + 45*mm, height - margin - 32*mm)
    
    # === METRICS PANEL ===
    panel_y = height - margin - 110 * mm
    panel_h = 65 * mm
    panel_w = right_w - 8*mm
    
    c.setFillColor(COLORS['bg_secondary'])
    c.roundRect(right_x, panel_y, panel_w, panel_h, 4*mm, fill=1, stroke=0)
    c.setStrokeColor(COLORS['border'])
    c.setLineWidth(0.35)
    c.roundRect(right_x, panel_y, panel_w, panel_h, 4*mm, fill=0, stroke=1)
    
    # Metric items - refined spacing
    metrics = [
        ('USE CASES', '847', 0.72, COLORS['success']),
        ('PRODUCT', '1,243', 0.58, COLORS['accent']),
        ('TECHNICAL', '3,891', 0.43, COLORS['amber']),
    ]
    
    metric_w = panel_w / 3
    for idx, (label, value, pct, color) in enumerate(metrics):
        mx = right_x + idx * metric_w + 10*mm
        
        # Label
        c.setFillColor(COLORS['text_muted'])
        c.setFont('GeistMono', 6)
        c.drawString(mx, panel_y + panel_h - 14*mm, label)
        
        # Value - large and prominent
        c.setFillColor(COLORS['text_primary'])
        c.setFont('WorkSans-Bold', 24)
        c.drawString(mx, panel_y + panel_h - 34*mm, value)
        
        # Progress bar - refined
        bar_y = panel_y + 10*mm
        bar_w = metric_w - 20*mm
        bar_h = 5*mm
        
        # Background track
        c.setFillColor(COLORS['bg_tertiary'])
        c.roundRect(mx, bar_y, bar_w, bar_h, 1.5*mm, fill=1, stroke=0)
        
        # Fill
        c.setFillColor(color)
        c.roundRect(mx, bar_y, bar_w * pct, bar_h, 1.5*mm, fill=1, stroke=0)
        
        # Percentage - aligned right
        c.setFillColor(COLORS['text_secondary'])
        c.setFont('GeistMono', 8)
        c.drawRightString(mx + bar_w, bar_y + bar_h + 6*mm, f'{int(pct * 100)}%')
    
    # === STATUS LEGEND ===
    status_y = panel_y - 55 * mm
    
    c.setFillColor(COLORS['text_muted'])
    c.setFont('GeistMono', 6)
    c.drawString(right_x, status_y + 38*mm, 'STATUS DISTRIBUTION')
    
    statuses = [
        ('COMPLETED', COLORS['success'], 0.72),
        ('IN PROGRESS', COLORS['accent'], 0.20),
        ('PENDING', COLORS['amber'], 0.08),
    ]
    
    for idx, (status, color, ratio) in enumerate(statuses):
        sy = status_y + 26*mm - idx * 12*mm
        
        # Refined dot indicator
        c.setFillColor(color)
        c.circle(right_x + 4*mm, sy + 2.5*mm, 3*mm, fill=1, stroke=0)
        
        # Label
        c.setFillColor(COLORS['text_secondary'])
        c.setFont('InstrumentSans', 8)
        c.drawString(right_x + 12*mm, sy, status)
        
        # Ratio - right aligned
        c.setFillColor(COLORS['text_primary'])
        c.setFont('GeistMono', 8)
        c.drawRightString(right_x + 75*mm, sy, f'{int(ratio * 100)}%')
    
    # === BOTTOM REFERENCE BAR ===
    ref_y = margin
    ref_h = 16 * mm
    
    c.setFillColor(COLORS['bg_tertiary'])
    c.roundRect(margin, ref_y, content_width, ref_h, 2*mm, fill=1, stroke=0)
    
    # Reference markers - refined positioning
    c.setFillColor(COLORS['text_muted'])
    c.setFont('GeistMono', 5.5)
    
    c.drawString(margin + 10*mm, ref_y + 5.5*mm, 'DOMAIN → FEATURE → PRODUCT FUNCTION → TECHNICAL FUNCTION')
    c.drawRightString(margin + content_width - 10*mm, ref_y + 5.5*mm, 'v0.3.0')
    c.drawCentredString(margin + content_width/2, ref_y + 5.5*mm, 'STRUCTURAL CLARITY')
    
    # === CORNER REGISTRATION MARKS ===
    marker_size = 5 * mm
    c.setStrokeColor(COLORS['accent'])
    c.setLineWidth(0.4)
    
    corners = [
        (margin - 10*mm, height - margin + 5*mm, 1, -1),   # Top-left
        (width - margin + 10*mm, height - margin + 5*mm, -1, -1),  # Top-right
        (margin - 10*mm, margin - 5*mm, 1, 1),             # Bottom-left
        (width - margin + 10*mm, margin - 5*mm, -1, 1),    # Bottom-right
    ]
    
    for cx, cy, dx, dy in corners:
        c.line(cx, cy, cx + marker_size * dx, cy)
        c.line(cx, cy, cx, cy + marker_size * dy)
    
    # === FINALIZE ===
    c.save()
    print(f"Canvas saved to: {output_path}")

if __name__ == "__main__":
    output_dir = "/Users/bobmax/Documents/00 ATOM/17 Functions/OCCluster/occluster-app/design"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "structural-clarity-canvas.pdf")
    draw_structural_clarity_canvas(output_path)
