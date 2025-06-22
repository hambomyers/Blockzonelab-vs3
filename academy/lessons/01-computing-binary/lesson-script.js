<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lesson 1: Computing & Binary Fundamentals - The Academy</title>
    <!-- Import centralized CSS system -->
    <link rel="stylesheet" href="../../../assets/css/design-system.css">
    <link rel="stylesheet" href="../../../assets/css/utilities.css">
    <link rel="stylesheet" href="../../../assets/css/components.css">
    <link rel="stylesheet" href="../../../assets/css/blockzone-system.css">
    <!-- Dynamic Bitcoin Price Updates -->
    <script src="../../../core-systems/bitcoin-price.js"></script>
    <style>
        /* All your existing styles remain exactly the same */
        .lesson-hero-redesigned {
            background: linear-gradient(135deg, rgba(26, 29, 41, 0.95), rgba(212, 175, 55, 0.08));
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: var(--radius-xl);
            margin-bottom: var(--space-8);
            padding: var(--space-8) var(--space-6);
            position: relative;
            overflow: hidden;
        }

        .lesson-hero-redesigned::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%);
            animation: heroGlow 8s ease-in-out infinite alternate;
        }

        @keyframes heroGlow {
            0% { transform: rotate(0deg) scale(0.8); opacity: 0.3; }
            100% { transform: rotate(10deg) scale(1.2); opacity: 0.1; }
        }

        .hero-content {
            position: relative;
            z-index: 2;
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
        }

        .hero-icon {
            font-size: 4rem;
            margin-bottom: var(--space-4);
            filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.3));
        }

        .hero-title {
            font-size: 3rem;
            font-weight: 700;
            color: var(--color-white);
            margin-bottom: var(--space-3);
            line-height: 1.1;
            background: linear-gradient(135deg, var(--color-white), var(--color-gold));
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
            font-size: 1.25rem;
            color: var(--color-text-secondary);
            margin-bottom: var(--space-6);
            font-weight: 400;
        }

        .hero-story-hook {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: var(--radius-lg);
            padding: var(--space-4) var(--space-5);
            margin: var(--space-6) auto;
            max-width: 600px;
            font-style: italic;
            color: var(--color-text);
            line-height: 1.6;
        }

        .hero-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: var(--space-4);
            margin-top: var(--space-6);
        }

        .hero-stat {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: var(--radius-lg);
            padding: var(--space-4);
            transition: all var(--transition-base);
        }

        .hero-stat:hover {
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(212, 175, 55, 0.4);
            transform: translateY(-2px);
        }

        .stat-icon {
            font-size: 2rem;
            filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.3));
        }

        .stat-info {
            flex: 1;
            text-align: left;
        }

        .stat-number {
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--color-gold);
            line-height: 1;
            margin-bottom: var(--space-1);
        }

        .stat-label {
            font-size: 0.875rem;
            color: var(--color-text-secondary);
            font-weight: 500;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
            .hero-title {
                font-size: 2.25rem;
            }
            
            .hero-stats-grid {
                grid-template-columns: 1fr;
                gap: var(--space-3);
            }
            
            .hero-stat {
                justify-content: center;
                text-align: center;
            }
            
            .stat-info {
                text-align: center;
            }
        }

        .lesson-navigation {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--space-6);
            padding: var(--space-3);
            background: rgba(37, 40, 54, 0.5);
            border-radius: var(--radius-lg);
        }

        .nav-button {
            padding: var(--space-2) var(--space-3);
            background: rgba(212, 175, 55, 0.1);
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: var(--radius-md);
            color: var(--color-gold);
            text-decoration: none;
            transition: all var(--transition-base);
        }

        .nav-button:hover {
            background: rgba(212, 175, 55, 0.2);
            transform: translateY(-2px);
        }

        .content-section {
            background: rgba(37, 40, 54, 0.8);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(212, 175, 55, 0.1);
            border-radius: var(--radius-xl);
            padding: var(--space-6);
            margin-bottom: var(--space-6);
        }

        .section-icon {
            font-size: 2rem;
            margin-bottom: var(--space-2);
        }

        .key-concept {
            background: rgba(212, 175, 55, 0.05);
            border-left: 4px solid var(--color-gold);
            padding: var(--space-3);
            margin: var(--space-4) 0;
            border-radius: 0 var(--radius-md) var(--radius-md) 0;
        }

        .binary-demo {
            display: flex;
            gap: var(--space-2);
            justify-content: center;
            margin: var(--space-4) 0;
            font-family: var(--font-mono);
            font-size: 2rem;
        }

        .bit {
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(26, 29, 41, 0.8);
            border: 2px solid rgba(212, 175, 55, 0.3);
            border-radius: var(--radius-md);
            cursor: pointer;
            transition: all var(--transition-base);
        }

        .bit:hover {
            border-color: var(--color-gold);
            transform: scale(1.1);
        }

        .bit.active {
            background: var(--color-gold);
            color: var(--color-navy);
            border-color: var(--color-gold);
        }

        .formula-box {
            background: rgba(26, 29, 41, 0.9);
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: var(--radius-lg);
            padding: var(--space-4);
            margin: var(--space-4) 0;
            text-align: center;
            font-family: var(--font-mono);
        }

        .timeline {
            position: relative;
            padding-left: var(--space-8);
        }

        .timeline::before {
            content: '';
            position: absolute;
            left: 20px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: linear-gradient(180deg, var(--color-gold), transparent);
        }

        .timeline-item {
            position: relative;
            margin-bottom: var(--space-4);
        }

        .timeline-item::before {
            content: '';
            position: absolute;
            left: -28px;
            top: 8px;
            width: 12px;
            height: 12px;
            background: var(--color-gold);
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
        }

        .timeline-year {
            font-weight: 700;
            color: var(--color-gold);
            margin-bottom: var(--space-1);
        }

        /* CONVERTER STYLES - keeping your exact design */
        .converter-section {
            margin: var(--space-8) 0;
            text-align: center;
        }

        .converter-container.wide {
            max-width: 1400px;
            margin: 2rem auto;
            padding: 2rem 1.5rem;
            background: linear-gradient(135deg, 
                rgba(26, 29, 41, 0.92), 
                rgba(212, 175, 55, 0.05));
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: 20px;
            box-shadow: 
                0 15px 30px rgba(0, 0, 0, 0.4),
                0 8px 15px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.15),
                inset 0 -1px 0 rgba(212