import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Table Tap - Smart Restaurant Ordering System';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
    // Fetch Outfit Bold font directly as ArrayBuffer
    const fontData = await fetch(
        new URL('https://github.com/google/fonts/raw/main/ofl/outfit/Outfit-Bold.ttf')
    ).then((res) => res.arrayBuffer());

    return new ImageResponse(
        (
            <div
                style={{
                    background: 'white',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: '"Outfit"',
                    position: 'relative',
                }}
            >
                {/* Background Pattern - Subtle dots */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                        opacity: 0.5,
                    }}
                />

                {/* Brand Container */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 10,
                        padding: '40px',
                        background: 'rgba(255,255,255,0.8)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '24px',
                        border: '1px solid rgba(0,0,0,0.05)',
                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                    }}
                >
                    {/* Logo Text */}
                    <div
                        style={{
                            fontSize: 100,
                            fontWeight: 900,
                            color: '#000',
                            letterSpacing: '-0.04em',
                            lineHeight: 1,
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        Table Tap
                        <div
                            style={{
                                width: '24px',
                                height: '24px',
                                background: '#ff6b00',
                                borderRadius: '50%',
                                marginLeft: '10px',
                                marginTop: '20px'
                            }}
                        />
                    </div>

                    {/* Tagline */}
                    <div
                        style={{
                            fontSize: 32,
                            color: '#666',
                            fontWeight: 600,
                            marginTop: '10px',
                            textAlign: 'center',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        Scan. Order. Enjoy.
                    </div>

                    {/* Feature Badge */}
                    <div
                        style={{
                            marginTop: '40px',
                            background: '#ff6b00',
                            color: 'white',
                            padding: '12px 32px',
                            borderRadius: '100px',
                            fontSize: 24,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >
                        Smart QR Ordering
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
            fonts: [
                {
                    name: 'Outfit',
                    data: fontData,
                    style: 'normal',
                    weight: 700,
                },
            ],
        }
    );
}
