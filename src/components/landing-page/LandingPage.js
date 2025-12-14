
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronDown } from "lucide-react";
// Auth modal removed: navigation will go to /login
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const image = "/image.jpg";
const happy = "/happy.jpg";
const guidance = "/guidance.jpg";   
const ceremony = "/ceremony.jpg";
const ijabo = "/ijabo.jpg";
const anne = "/anne.jpg";
const jesi = "/jesi.jpg";
const learning = "/learning.jpg";
const connect = "/connect.webp";
const win = "/win.jpg";
const visitation = "/visitation.jpg";

export default function LandingPage({ onAuthSuccess }){
  const [isScrolled, setIsScrolled] = useState(false);
  // auth modal state removed
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const router = useRouter();
  
  const carouselImages = [
    { src: image, label: "Community Gathering" },
    { src: happy, label: "Joyful Moments" }
  ];

  const handleShowAuth = (mode = "login") => {
    // Navigate to the login page instead of opening the modal
    // include query param to indicate signup if needed
    if (mode === "signup") router.push('/login?mode=signup')
    else router.push('/login')
  }

  // auth modal handlers removed

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);	
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
    }, 5000); 
    
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  return (
    <div className="text-neutral-700 box-border caret-transparent">
      <header aria-label="Site" className="box-border caret-transparent">
        <div className={`fixed box-border caret-transparent w-screen z-[100] top-0 inset-x-0 transition-all duration-300 bg-white`}>
          <div className="box-border caret-transparent px-[4.16667%]">
            <div className="box-border caret-transparent flex h-20 justify-between max-w-[1800px] mx-auto">
              <div className="items-center box-border caret-transparent flex justify-between min-h-0 min-w-0 w-full">
                <div className="box-border caret-transparent h-auto min-h-0 min-w-0 md:h-full">
                  <nav aria-label="primary" className="static box-border caret-transparent h-auto md:relative md:h-full">
                    <ul className="[align-items:normal] box-border caret-transparent block h-full justify-normal list-none pl-0 md:items-center md:flex md:justify-end">
                      <li className="relative text-base [align-items:normal] box-border caret-transparent list-item h-auto leading-[28.0008px] min-h-0 min-w-0 mr-0 md:items-center md:flex md:h-full md:leading-[34px] md:min-h-[auto] md:min-w-[auto] md:mr-8">
                        <HoverCard openDelay={0} closeDelay={0}>
                          <HoverCardTrigger asChild>
                            <a className="text-neutral-700 font-normal box-border caret-transparent block tracking-[0.3px] leading-[26px] min-h-0 min-w-0 text-left w-full pl-[30px] pr-20 py-5 md:leading-7 md:min-h-[auto] md:min-w-[auto] md:p-0 hover:text-neutral-900 transition-colors cursor-pointer flex items-center space-x-2 group">
                              <span>Home</span>
                              <ChevronDown className="h-3 w-3 text-neutral-400 transition-transform duration-300 group-hover:-rotate-180" />
                            </a>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-96 h-54 p-0 border-0 shadow-2xl bg-green-100 rounded-sm ml-[20px] overflow-hidden z-[9999]">
                            <div className="flex h-full">
                              <div className="w-40 flex-shrink-0 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center overflow-hidden">
                                <Image
                                  src={ceremony}  
                                  alt="Home"
                                  width={160}
                                  height={216}
                                  className="w-full h-full object-cover rounded-l-lg"
                                />
                              </div>
                              <div className="flex-1 p-4 flex flex-col justify-between">
                                <div>
                                  <h3 className="text-green-900 text-lg font-bold mb-2">Home</h3>
                                  <p className="text-neutral-700 text-sm leading-relaxed">
                                    Discover the latest posts, updates, and moments from your fellow ASYV members. Your village, your stories — all in one place.
                                  </p>
                                </div>
                                <button className="bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-green-700 transition-colors w-fit">
                                  Explore Feed
                                </button>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </li>
                      <li className="relative text-base [align-items:normal] box-border caret-transparent list-item h-auto leading-[28.0008px] min-h-0 min-w-0 mr-0 md:items-center md:flex md:h-full md:leading-[34px] md:min-h-[auto] md:min-w-[auto] md:mr-8">
                        <HoverCard openDelay={0} closeDelay={0}>
                          <HoverCardTrigger asChild>
                            <a className="text-neutral-700 font-normal box-border caret-transparent block tracking-[0.3px] leading-[26px] min-h-0 min-w-0 text-left w-full pl-[30px] pr-20 py-5 md:leading-7 md:min-h-[auto] md:min-w-[auto] md:p-0 hover:text-neutral-900 transition-colors cursor-pointer flex items-center space-x-2 group">
                              <span>Connect</span>
                              <ChevronDown className="h-3 w-3 text-neutral-400 transition-transform duration-300 group-hover:-rotate-180" />
                            </a>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-96 h-54 p-0 border-0 shadow-2xl bg-green-100 ml-[20px] rounded-sm overflow-hidden z-[9999]">
                            <div className="flex h-full">
                              <div className="w-40 flex-shrink-0 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden">
                                <Image 
                                  src={ijabo} 
                                  alt="Connect" 
                                  width={160}
                                  height={216}
                                  className="w-full h-full object-cover rounded-l-lg" 
                                />
                              </div>
                              <div className="flex-1 p-4 flex flex-col justify-between">
                                <div>
                                  <h3 className="text-green-900 text-lg font-bold mb-2">Connect</h3>
                                  <p className="text-neutral-700 text-sm leading-relaxed">
                                    Build meaningful relationships with ASYV family members worldwide. Share, collaborate, and grow together.
                                  </p>
                                </div>
                                <button className="bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-green-700 transition-colors w-fit">
                                  Start Now
                                </button>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </li>
                      <li className="relative text-base [align-items:normal] box-border caret-transparent list-item h-auto leading-[28.0008px] min-h-0 min-w-0 mr-0 md:items-center md:flex md:h-full md:leading-[34px] md:min-h-[auto] md:min-w-[auto] md:mr-8">
                        <HoverCard openDelay={0} closeDelay={0}>
                          <HoverCardTrigger asChild>
                            <a className="text-neutral-700 font-normal box-border caret-transparent block tracking-[0.3px] leading-[26px] min-h-0 min-w-0 text-left w-full pl-[30px] pr-20 py-5 md:leading-7 md:min-h-[auto] md:min-w-[auto] md:p-0 hover:text-neutral-900 transition-colors cursor-pointer flex items-center space-x-2 group">
                              <span>Stories</span>
                              <ChevronDown className="h-3 w-3 text-neutral-400 transition-transform duration-300 group-hover:-rotate-180" />
                            </a>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-96 h-54 p-0 border-0 shadow-2xl bg-green-100 rounded-lg overflow-hidden z-[9999]">
                            <div className="flex h-full">
                              <div className="w-40 flex-shrink-0 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center overflow-hidden">
                                <Image 
                                  src={anne} 
                                  alt="Stories" 
                                  width={160}
                                  height={216}
                                  className="w-full h-full object-cover rounded-l-lg" 
                                />
                              </div>
                              <div className="flex-1 p-4 flex flex-col justify-between">
                                <div>
                                  <h3 className="text-green-900 text-lg font-bold mb-2">Stories</h3>
                                  <p className="text-neutral-700 text-sm leading-relaxed">
                                    Share your journey, celebrate victories, and inspire others with your unique ASYV story.
                                  </p>
                                </div>
                                <button className="bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-green-700 transition-colors w-fit">
                                  Share Now
                                </button>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </li>
                      <li className="relative text-base [align-items:normal] box-border caret-transparent list-item h-auto leading-[28.0008px] min-h-0 min-w-0 mr-0 md:items-center md:flex md:h-full md:leading-[34px] md:min-h-[auto] md:min-w-[auto] md:mr-8">
                        <HoverCard openDelay={0} closeDelay={0}>
                          <HoverCardTrigger asChild>
                            <a className="text-neutral-700 font-normal box-border caret-transparent block tracking-[0.3px] leading-[26px] min-h-0 min-w-0 text-left w-full pl-[30px] pr-20 py-5 md:leading-7 md:min-h-[auto] md:min-w-[auto] md:p-0 hover:text-neutral-900 transition-colors cursor-pointer flex items-center space-x-2 group">
                              <span>Mentors</span>
                              <ChevronDown className="h-3 w-3 text-neutral-400 transition-transform duration-300 group-hover:-rotate-180" />
                            </a>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-96 h-54 p-0 border-0 shadow-2xl bg-green-100 rounded-ms overflow-hidden z-[9999]">
                            <div className="flex h-full">
                              <div className="w-40 flex-shrink-0 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden">
                                <Image 
                                  src={learning} 
                                  alt="Mentors" 
                                  width={160}
                                  height={216}
                                  className="w-full h-full object-cover rounded-l-lg" 
                                />
                              </div>
                              <div className="flex-1 p-4 flex flex-col justify-between">
                                <div>
                                  <h3 className="text-green-900 text-lg font-bold mb-2">Mentors</h3>
                                  <p className="text-neutral-700 text-sm leading-relaxed">
                                    Connect with experienced mentors who can guide you through career, personal growth, and life challenges.
                                  </p>
                                </div>
                                <button className="bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-green-700 transition-colors w-fit">
                                  Find Mentor
                                </button>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </li>
                      <li className="relative text-base [align-items:normal] box-border caret-transparent list-item h-auto leading-[28.0008px] min-h-0 min-w-0 md:items-center md:flex md:h-full md:leading-[34px] md:min-h-[auto] md:min-w-[auto]">
                        <HoverCard openDelay={0} closeDelay={0}>
                          <HoverCardTrigger asChild>
                            <a className="text-neutral-700 font-normal box-border caret-transparent block tracking-[0.3px] leading-[26px] min-h-0 min-w-0 text-left w-full pl-[30px] pr-20 py-5 md:leading-7 md:min-h-[auto] md:min-w-[auto] md:p-0 hover:text-neutral-900 transition-colors cursor-pointer flex items-center space-x-2 group">
                              <span>Events</span>
                              <ChevronDown className="h-3 w-3 text-neutral-400 transition-transform duration-300 group-hover:-rotate-180" />
                            </a>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-96 h-54 p-0 border-0 shadow-2xl bg-green-100 rounded-sm overflow-hidden z-[9999]">
                            <div className="flex h-full">
                              <div className="w-40 flex-shrink-0 bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center overflow-hidden">
                                <Image 
                                  src={anne} 
                                  alt="Events" 
                                  width={160}
                                  height={216}
                                  className="w-full h-full object-cover rounded-l-lg" 
                                />
                              </div>
                              <div className="flex-1 p-4 flex flex-col justify-between">
                                <div>
                                  <h3 className="text-green-900 text-lg font-bold mb-2">Events</h3>
                                  <p className="text-neutral-700 text-sm leading-relaxed">
                                    Discover and join exciting events, webinars, and gatherings happening in the ASYV community.
                                  </p>
                                </div>
                                <button className="bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-green-700 transition-colors w-fit">
                                  View Events
                                </button>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </li>
                    </ul>
                  </nav>
                </div>
                <div className="items-center box-border caret-transparent flex">
                  <div className="box-border caret-transparent min-h-0 min-w-0 mr-4">
                    <button
                      onClick={() => router.push('/login?mode=signup')}
                      className="bg-green-700 text-white text-sm font-medium box-border caret-transparent px-6 py-2.5 rounded-md hover:bg-green-800 transition-colors hover:cursor-pointer">
                      Join Community
                    </button>
                  </div>
                  <div className="box-border caret-transparent min-h-0 min-w-0 hover:cursor-pointer">
                    {/* Simple button if EyeCatchingButton_v2 is missing */}
                    <button
                      onClick={() => router.push('/login')}
                      className="border border-gray-300 px-6 py-2.5 rounded-md hover:bg-gray-50 transition-colors hover:cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </div>  
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* auth modal removed: landing page now navigates to /login */}
      
      <main className="box-border caret-transparent">
        {/* Hero Section */}  
        <section className="box-border caret-transparent">
          <div className="relative bg-transparent box-border caret-transparent list-none min-h-[150px] z-[1] overflow-hidden mx-auto">
            <div className="relative caret-transparent flex h-full w-full z-[1]">
              <div className="relative box-border caret-transparent shrink-0 h-full w-full">
                <div className="relative bg-cover box-border caret-transparent h-80 overflow-hidden bg-center md:h-[900px]">
                  <div className="box-border caret-transparent w-full">
                    {/* Hero Background Image Carousel */}
                    <div className="absolute inset-0 bg-neutral-900">
                      {carouselImages.map((imageObj, index) => (
                        <div 
                          key={index}
                          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          <Image
                            src={imageObj.src}
                            alt={imageObj.label}
                            fill
                            className="object-cover"
                            priority={index === 0}
                          />
                        </div>
                      ))}
                    </div>
                   
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50 flex items-center justify-center">
                      <div className="text-center">
                        <div className="inline-block">
                          <div className="text-white">
                            <div className="text-6xl md:text-8xl font-light tracking-wide leading-none mb-4">
                              ASYV
                            </div>
                            <div className="text-xl md:text-2xl font-light tracking-widest uppercase border-t border-white/30 pt-4 mb-8">
                              COMMUNITY
                            </div>
                            <p className="text-lg md:text-xl font-light mt-6 max-w-2xl mx-auto leading-relaxed text-white/90">
                              Connecting hearts, sharing stories, building futures together across the globe
                            </p>
                            <div className="mt-12 flex gap-4 justify-center">
                              <button className="bg-green-700 text-white text-base font-medium px-8 py-3 rounded-md hover:bg-orange-500 transition-colors">
                                Get Started
                              </button>
                              <button className="bg-transparent text-white text-base font-medium px-8 py-3 rounded-md border border-orange-500 hover:bg-white/10 transition-colors">
                                Learn More
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Carousel Indicator Dots */}
                      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
                        {carouselImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                              index === currentImageIndex 
                                ? 'bg-white w-8' 
                                : 'bg-white/50 hover:bg-white/75'
                            }`}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="box-border caret-transparent py-20 bg-neutral-50">
          <div className="max-w-[1800px] mx-auto px-[6.25%]">
            <div className="text-center mb-16">
              <h2 className="text-orange-500 text-3xl md:text-4xl font-light mb-6 tracking-wide mb-12">
                Our Community Platform
              </h2>
              <div className="flex justify-center gap-35">
                <div>
                  {/* Simple heading if TypingText is missing */}
                  <h3 className="text-4xl font-bold text-green-600">
                    Connect, Share, and Grow with the ASYV Family
                  </h3>
                  <p className="text-base md:text-lg text-neutral-600 max-w-3xl mx-auto leading-relaxed mt-4">
                    A dedicated space for ASYV family members to connect, share, and grow together no matter where you are in the world.
                  </p>
                  <div className="mt-12">
                    <div className="bg-white h-[400px] p-8 rounded-lg shadow-sm border border-neutral-100 text-center hover:shadow-md transition-shadow">
                      <p className="text-neutral-600 font-montserrat text-xl leading-relaxed">
                        Our platform offers comprehensive tools for connection, growth, and inspiration. Real-time Chat provides instant text, voice, and video communication to stay connected. The Mentorship program facilitates meaningful, cross-generational relationships by pairing those seeking guidance with those who can provide it. Finally, the Share Stories feature allows members to celebrate successes and inspire others with their unique journeys, fostering a strong sense of community.
                      </p>
                    </div>
                  </div>
                </div>
                <Image 
                  src={connect} 
                  alt="Phone" 
                  width={480}
                  height={536}
                  className="mx-auto mb-6 w-120 h-134"
                />
              </div>
            </div>
          </div>
        </section>
        
        <section className="box-border caret-transparent py-20">
          <div className="[align-items:normal] box-border caret-transparent block max-w-[1800px] mx-auto md:items-center md:flex">
            <div className="relative box-border caret-transparent basis-auto list-none min-h-0 min-w-0 z-[1] overflow-hidden mx-auto md:basis-[66.6667%] md:min-h-[auto] md:min-w-[auto]">
              <div className="relative caret-transparent flex h-full w-full z-[1]">
                <div className="relative box-border caret-transparent shrink-0 h-full w-full">
                  <div className="box-border caret-transparent">
                    <Image 
                      src={happy}
                      width={1200}
                      height={800}
                      className="box-border caret-transparent w-full rounded-sm ml-4" 
                      alt="Video Call" 
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="box-border caret-transparent block basis-auto flex-row justify-normal min-h-0 min-w-0 pt-5 pb-[35px] px-[6.25%] md:flex md:basis-[33.3333%] md:flex-col md:justify-center md:min-h-[auto] md:min-w-[auto] md:pt-[35px] md:px-[4.16667%]">
              <div className="box-border caret-transparent min-h-0 min-w-0 mb-2.5 md:min-h-[auto] md:min-w-[auto]">
                <h3 className="text-green-900 text-2xl box-border caret-transparent leading-[36.0022px] font-medium md:text-3xl md:leading-[48.0016px]">
                  Face-to-Face Connections
                </h3>
              </div>
              <div className="box-border caret-transparent min-h-0 min-w-0 mb-[15px] md:min-h-[auto] md:min-w-[auto]">
                <p className="text-base box-border caret-transparent leading-relaxed text-neutral-600 md:text-lg">
                  Experience the warmth of family through high-quality video calls. Share laughter, stories, and create new memories together in real-time.
                </p>
              </div>
              <div className="box-border caret-transparent min-h-0 min-w-0 md:min-h-[auto] md:min-w-[auto]">
                <a href="#" className="relative text-orange-600 text-base font-medium box-border caret-transparent tracking-[0.3px] leading-[22.0014px] hover:text-neutral-600 hover:underline inline-flex items-center gap-2">
                  Start Video Call
                  <span className="text-lg">→</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Community Stories */}
        <section className="bg-green-900 box-border caret-transparent max-w-[1800px] mx-auto my-20 rounded-lg">
          <div className="box-border caret-transparent text-center px-[6.25%] py-10 md:px-[22.9167%] md:py-[75px]">
            <div className="box-border caret-transparent mb-[15px] md:mb-5">
              <h2 className="text-white text-3xl box-border caret-transparent leading-[38.0016px] font-light md:text-4xl md:leading-[48.0016px]">
                Share Your Journey
              </h2>
            </div>
            <div className="box-border caret-transparent mb-5">
              <p className="text-white/80 text-base box-border caret-transparent leading-relaxed md:text-lg">
                Every story matters. Share your experiences, challenges, and triumphs with the ASYV family worldwide.
              </p>
            </div>
            <div className="box-border caret-transparent">
              <a href="#" className="relative text-white text-base font-medium box-border caret-transparent tracking-[0.3px] leading-[22.0014px] hover:underline inline-flex items-center gap-2">
                Share Your Story
                <span className="text-lg">→</span>
              </a>
            </div>
          </div>
        </section>

        {/* Mentorship Section */}
        <section className="box-border caret-transparent max-w-[1800px] mx-auto py-20">
          <div className="box-border caret-transparent px-[8.33333%]">
            <div className="box-border caret-transparent block mb-[25px] md:flex md:mb-[15px]">
              <div className="box-border caret-transparent basis-auto shrink min-h-0 min-w-0 w-auto -mb-2.5 md:basis-3/5 md:shrink-0 md:min-h-[auto] md:min-w-[auto] md:w-3/5">
                <h2 className="text-neutral-900 text-3xl box-border caret-transparent leading-[46.0008px] font-light md:text-4xl md:leading-[60px]">
                 Find Your Mentor
                </h2>
              </div>
            </div>
            <div className="box-border caret-transparent block md:flex gap-8">
              <div className="relative box-border caret-transparent basis-auto shrink h-auto min-h-0 min-w-0 w-auto pb-[25px] md:basis-3/5 md:shrink-0 md:h-full md:min-h-[auto] md:min-w-[auto] md:w-3/5 md:pb-0">
                <div className="box-border caret-transparent mb-[23px] md:mb-0 md:mx-0">
                  <Image 
                    src={jesi}
                    width={800}
                    height={800}
                    alt="Mentorship" 
                    className="aspect-square box-border caret-transparent object-cover w-full rounded-lg" 
                  />
                </div>
              </div>
              <div className="box-border caret-transparent basis-2/5 flex flex-col justify-center">
                <h3 className="text-orange-500 text-2xl box-border caret-transparent leading-[36.0022px] font-medium md:text-3xl md:leading-[42px] mb-4">
                  Guidance That Transforms
                </h3>
                <p className="text-base box-border caret-transparent leading-relaxed text-neutral-600 md:text-lg mb-6">
                  Connect with experienced mentors who can guide you through career choices, personal growth, and life challenges.
                </p>
                <button className="bg-green-900 text-white text-base font-medium px-6 py-3 rounded-md hover:bg-neutral-800 transition-colors w-fit">
                  Become a Mentor
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 box-border caret-transparent">
        <div className="box-border caret-transparent max-w-[1800px] mx-auto">
          <div className="bg-none bg-repeat box-border caret-transparent bg-left-top pt-10 pb-[50px] px-[6.25%] md:pt-[77px] md:pb-[57px]">
            <div className="box-border caret-transparent flex flex-col flex-nowrap mb-10 md:flex-row md:flex-wrap md:mb-20">
              <div className="box-border caret-transparent block basis-auto shrink mr-0 mb-[30px] md:flex md:basis-[40.4762%] md:shrink-0 md:mr-[7.14286%] md:mb-0">
                <div className="box-border caret-transparent min-h-0 min-w-0 w-full mb-5 md:min-h-[auto] md:min-w-[auto]">
                  <nav aria-label="tertiary" className="box-border caret-transparent flex justify-between">
                    <ul className="box-border caret-transparent basis-6/12 list-none pl-0 md:basis-[35%]">
                      <li className="text-base box-border caret-transparent leading-[28.0008px] mb-4 pr-5 md:pr-0">
                        <a href="#" className="text-neutral-400 text-sm box-border caret-transparent leading-[28.0008px] hover:text-white transition-colors">
                          About ASYV
                        </a>
                      </li>
                      <li className="text-base box-border caret-transparent leading-[28.0008px] mb-4 pr-5 md:pr-0">
                        <a href="#" className="text-neutral-400 text-sm box-border caret-transparent leading-[28.0008px] hover:text-white transition-colors">
                          Community Guidelines
                        </a>
                      </li>
                      <li className="text-base box-border caret-transparent leading-[28.0008px] mb-4 pr-5 md:pr-0">
                        <a href="#" className="text-neutral-400 text-sm box-border caret-transparent leading-[28.0008px] hover:text-white transition-colors">
                          Privacy Policy
                        </a>
                      </li>
                    </ul>
                    <ul className="box-border caret-transparent basis-6/12 list-none pl-0 md:basis-[35%]">
                      <li className="text-base box-border caret-transparent leading-[28.0008px] mb-4 pr-5 md:pr-0">
                        <a href="#" className="text-neutral-400 text-sm box-border caret-transparent leading-[28.0008px] hover:text-white transition-colors">
                          Contact
                        </a>
                      </li>
                      <li className="text-base box-border caret-transparent leading-[28.0008px] mb-4 pr-5 md:pr-0">
                        <a href="#" className="text-neutral-400 text-sm box-border caret-transparent leading-[28.0008px] hover:text-white transition-colors">
                          Support
                        </a>
                      </li>
                      <li className="text-base box-border caret-transparent leading-[28.0008px] mb-4 pr-5 md:pr-0">
                        <a href="#" className="text-neutral-400 text-sm box-border caret-transparent leading-[28.0008px] hover:text-white transition-colors">
                          FAQ
                        </a>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
              <div className="box-border caret-transparent basis-auto grow-0 shrink ml-0 md:basis-[30.9524%] md:grow md:shrink-0 md:ml-auto">
                <div className="text-neutral-400 box-border caret-transparent">
                  <p className="text-sm box-border caret-transparent leading-relaxed">
                    ASYV Community Platform<br />
                    Connecting Families Worldwide<br />
                    Building Futures Together<br />
                  </p>
                </div>
              </div>
            </div>
            <div className="box-border caret-transparent flex flex-col flex-nowrap justify-between md:flex-row md:flex-wrap">
              <div className="items-center box-border caret-transparent flex max-w-[250px] mb-10 mx-auto md:mb-0 md:mx-0">
                <div className="text-white text-center">
                  <div className="text-xl font-light">ASYV</div>
                  <div className="text-xs tracking-widest">COMMUNITY</div>
                </div>
              </div>
              <div className="box-border caret-transparent">
                <div className="text-neutral-500 box-border caret-transparent leading-[26px] text-center text-sm md:text-right">
                  © 2025 ASYV Community Platform. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}