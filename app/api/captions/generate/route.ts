import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Simulate AI processing time (e.g., reading pixels, generating NLP text)
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Mock highly realistic AI-generated captions based on a generic marketing context
    const captions = {
      facebook: "Exciting news! 🚀 We've just unveiled our latest project and we couldn't wait to share it with you all. The dedication and hard work from the team really shine through in this one. What do you think of the new look? Let us know in the comments below! 👇 #Innovation #NewRelease #MarketingHub",
      instagram: "Vision meets reality. ✨\n\nWe are beyond thrilled to share what we've been working on. This isn't just an update—it's a revolution in how we create. Swipe to see the details, and drop a 💜 if you're as obsessed as we are!\n\nLink in bio to learn more.\n\n#CreativeStudio #DesignInspiration #Innovation #NextGen #MarketingStrategy",
      x: "The wait is over! 🎉 We're thrilled to drop our latest release today. Faster, sleeker, and built for creators. Check out the link below to see all the new features. What's your favorite update so far? Let's discuss! 👇 #TechLaunch #Creators",
      linkedin: "I am incredibly proud of our team's hard work in bringing this vision to life. Today, we are launching a project that redefines efficiency and creativity in our industry.\n\nBy leveraging cutting-edge design principles and advanced technology, we've built a solution that scales with your business needs.\n\nI'd love to hear your thoughts on the new capabilities. How do you see this impacting your workflow?\n\n#Leadership #Innovation #TechLaunch #FutureOfWork #Productivity"
    };

    return NextResponse.json({ captions });
  } catch (error) {
    console.error('Error generating captions:', error);
    return NextResponse.json({ error: 'Failed to generate captions' }, { status: 500 });
  }
}
