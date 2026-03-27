'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
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
const jesi = "/asyvceo.webp";
const learning = "/learning.jpg";
const connect = "/connect_.webp";
const inganji = '/images/inganji.webp';
const cousin = '/images/cousin.webp';
const win = "/win.jpg";
const visitation = "/visitation.jpg";

const navItems = [
  {
    title: "Home",
    message: "Returning to our roots. Where the heart finds its rhythm and the family stays whole.",
    image: win
  },
  {
    title: "Connect",
    message: "Bridging oceans and borders. Rediscover your brothers and sisters, no matter where life has led them.",
    image: connect
  },
  {
    title: "Stories",
    message: "Your voice is our legacy. Share the journey you've walked and be the light for those following in your footsteps.",
    image: ijabo
  },
  {
    title: "Mentors",
    message: "The wisdom of the Village continues. Guidance for your career, your craft, and your soul.",
    image: cousin
  },
  {
    title: "Events",
    message: "Gathering under the same sky again. Moments of celebration, reunion, and shared purpose.",
    image: inganji
  }
];

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

const slideInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const slideInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

export default function LandingPage({ onAuthSuccess }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const carouselImages = [
    { src: image, label: "Community Gathering" },
    { src: happy, label: "Joyful Moments" }
  ];

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
    <div className="text-neutral-700 dark:text-gray-300 box-border caret-transparent overflow-x-hidden flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
      <header aria-label="Site" className="box-border caret-transparent">
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`fixed box-border caret-transparent w-full z-[100] top-0 inset-x-0 transition-all duration-300 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800`}
        >
          <div className="box-border caret-transparent px-4 md:px-[4.16667%]">
            <div className="box-border caret-transparent flex h-16 md:h-20 justify-between max-w-[1800px] mx-auto">
              <div className="items-center box-border caret-transparent flex justify-between min-h-0 min-w-0 w-full">
                {/* Mobile Menu Button */}
                <button
                  className="md:hidden text-neutral-700 dark:text-gray-300"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <div className="box-border caret-transparent h-auto min-h-0 min-w-0 md:h-full md:flex-1">
                  <nav aria-label="primary" className="static box-border caret-transparent h-auto md:relative md:h-full">
                    {/* Desktop Navigation */}
                    <ul className="[align-items:normal] box-border caret-transparent hidden h-full justify-normal list-none pl-0 md:flex md:items-center md:justify-space-between">
                      {navItems.map((item, index) => (
                        <motion.li
                          key={item.title}
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className="relative text-base [align-items:normal] box-border caret-transparent list-item h-auto leading-[28.0008px] min-h-0 min-w-0 mr-0 md:items-center md:flex md:h-full md:leading-[34px] md:min-h-[auto] md:min-w-[auto] md:mr-8"
                        >
                          <HoverCard openDelay={0} closeDelay={0}>
                            <HoverCardTrigger asChild>
                              <motion.a
                                whileHover={{ scale: 1.05 }}
                                className="text-neutral-700 dark:text-gray-300 font-normal box-border caret-transparent block tracking-[0.3px] leading-[26px] min-h-0 min-w-0 text-left w-full pl-[30px] pr-20 py-5 md:leading-7 md:min-h-[auto] md:min-w-[auto] md:p-0 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer flex items-center space-x-2 group"
                              >
                                <span>{item.title}</span>
                                <ChevronDown className="h-3 w-3 text-neutral-400 dark:text-gray-500 transition-transform duration-300 group-hover:-rotate-180" />
                              </motion.a>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80 md:w-96 h-54 p-0 border-0 shadow-2xl bg-green-50 dark:bg-gray-800 rounded-sm ml-[20px] overflow-hidden z-[9999]">
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className="flex h-full"
                              >
                                <div className="w-32 md:w-40 flex-shrink-0 bg-gradient-to-br from-green-400 to-green-600 dark:from-green-600 dark:to-green-800 flex items-center justify-center overflow-hidden">
                                  <Image
                                    src={item.image}
                                    alt={item.title}
                                    width={160}
                                    height={216}
                                    className="w-full h-full object-cover rounded-l-lg"
                                  />
                                </div>
                                <div className="flex-1 p-4 flex flex-col justify-between">
                                  <div>
                                    <h3 className="text-green-800 dark:text-green-400 text-lg font-bold mb-2">{item.title}</h3>
                                    <p className="text-neutral-600 dark:text-gray-300 text-sm leading-relaxed">
                                      {item.message}
                                    </p>
                                  </div>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-green-600 dark:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-green-700 dark:hover:bg-green-600 transition-colors w-fit transform-gpu"
                                  >
                                    Explore Now
                                  </motion.button>
                                </div>
                              </motion.div>
                            </HoverCardContent>
                          </HoverCard>
                        </motion.li>
                      ))}
                    </ul>
                  </nav>
                </div>
                <div className="items-center box-border caret-transparent flex">
                  <div className="box-border caret-transparent min-h-0 min-w-0 mr-2 md:mr-4">
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(21, 128, 61, 0.3)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push('/login?mode=login')}
                      className="bg-green-700 dark:bg-green-600 text-white text-xs md:text-sm font-medium box-border caret-transparent px-4 md:px-6 py-2 md:py-2.5 rounded-md hover:bg-green-800 dark:hover:bg-green-700 transition-all duration-300 transform-gpu"
                    >
                      Join Community
                    </motion.button>
                  </div>
                  <div className="box-border caret-transparent min-h-0 min-w-0 hover:cursor-pointer">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push('/login')}
                      className="border border-gray-300 dark:border-gray-600 px-4 md:px-6 py-2 md:py-2.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 transform-gpu text-xs md:text-sm text-neutral-700 dark:text-gray-300"
                    >
                      Sign In
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {["Home", "Connect", "Stories", "Mentors", "Events"].map((item, index) => (
                  <motion.a
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    href="#"
                    className="block py-2 px-3 text-neutral-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                  >
                    {item}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </header>
      
      <main className="box-border caret-transparent pt-16 md:pt-0 flex-1 bg-white dark:bg-gray-900 transition-colors duration-300">
        {/* Hero Section */}
        <section className="box-border caret-transparent">
          <div className="relative bg-transparent box-border caret-transparent list-none z-[1] mx-auto">
            <div className="relative caret-transparent flex h-full w-full z-[1]">
              <div className="relative box-border caret-transparent shrink-0 h-full w-full">
                <div className="relative bg-cover box-border caret-transparent h-[560px] sm:h-[500px] md:h-80 lg:h-[900px] bg-center overflow-hidden">
                  <div className="box-border caret-transparent w-full">
                    <div className="absolute inset-0 bg-neutral-900 dark:bg-black">
                      {carouselImages.map((imageObj, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: index === currentImageIndex ? 1 : 0 }}
                          transition={{ duration: 1, ease: "easeInOut" }}
                          className={`absolute inset-0`}
                        >
                          <Image
                            src={imageObj.src}
                            alt={imageObj.label}
                            fill
                            className="object-cover"
                            priority={index === 0}
                          />
                        </motion.div>
                      ))}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70 dark:from-black/60 dark:to-black/80 flex items-center justify-center px-4">
                      <div className="text-center w-full max-w-6xl">
                        <motion.div
                          initial={{ opacity: 0, y: 50 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="inline-block"
                        >
                          <div className="text-white">
                            <div className="relative group">
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-light tracking-wide leading-none mb-4 relative overflow-hidden"
                              >
                                <span className="relative z-10">ASYV</span>
                                <motion.div
                                  initial={{ x: "-100%" }}
                                  animate={{ x: "100%" }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatDelay: 0.05,
                                    ease: "easeInOut"
                                  }}
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                />
                              </motion.div>
                            </div>
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.6, delay: 0.4 }}
                              className="text-base sm:text-lg md:text-xl lg:text-2xl font-light tracking-widest uppercase border-t border-white/30 pt-3 md:pt-4 mb-6 md:mb-8"
                            >
                              COMMUNITY
                            </motion.div>
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.6, delay: 0.6 }}
                              className="text-sm sm:text-base md:text-lg lg:text-xl font-light mt-4 md:mt-6 mx-auto leading-relaxed text-white/90 max-w-2xl"
                            >
                              Connecting hearts, sharing stories, building futures together across the globe
                            </motion.p>
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.6, delay: 0.8 }}
                              className="mt-8 md:mt-12 flex flex-col sm:flex-row gap-3 md:gap-4 justify-center sm:mb-2"
                            >
                              <motion.button
                                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(21, 128, 61, 0.4)" }}
                                whileTap={{ scale: 0.95 }}
                                className="relative bg-green-700 dark:bg-green-600 text-white text-sm md:text-base font-medium px-6 md:px-8 py-2.5 md:py-3 rounded-md hover:bg-green-600 dark:hover:bg-green-700 transition-all duration-300 transform-gpu overflow-hidden group"
                              >
                                <Link href="/login" className="relative z-10">Get Started</Link>
                                <motion.div
                                  initial={{ x: "-100%" }}
                                  animate={{ x: "100%" }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatDelay: 0.3,
                                    ease: "easeInOut"
                                  }}
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-transparent text-white text-sm md:text-base font-medium px-6 md:px-8 py-2.5 md:py-3 rounded-md border border-orange-500 hover:bg-white/10 transition-all duration-300 transform-gpu"
                              >
                                Learn More
                              </motion.button>
                            </motion.div>
                          </div>
                        </motion.div>
                      </div>
                      <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
                        {carouselImages.map((_, index) => (
                          <motion.button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer transform-gpu ${
                              index === currentImageIndex
                                ? 'bg-white'
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
        <section className="box-border sm:mt-2 caret-transparent mt-10 md:py-20 bg-neutral-50 dark:bg-gray-800/50 transition-colors duration-300">
          <div className="max-w-[1800px] mx-auto px-4 md:px-[6.25%]">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, margin: "-50px" }}
              variants={fadeInUp}
              className="text-center mb-8 md:mb-16"
            >
              <h2 className="text-orange-500 dark:text-orange-400 text-2xl md:text-3xl lg:text-4xl font-light mb-4 md:mb-6 tracking-wide">
                Our Community Platform
              </h2>
              <div className="flex flex-col lg:flex-row justify-center items-center lg:items-start lg:justify-between gap-8 md:gap-12">
                <motion.div
                  variants={slideInLeft}
                  className="lg:w-1/2"
                >
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-green-600 dark:text-green-500 mb-4">
                    Connect, Share, and Grow with the ASYV Family
                  </h3>
                  <p className="text-base md:text-lg text-neutral-600 dark:text-gray-400 max-w-3xl mx-auto lg:mx-0 leading-relaxed mt-4 mb-6">
                    A dedicated space for ASYV family members to connect, share, and grow together no matter where you are in the world.
                  </p>
                  <motion.div
                    variants={fadeInUp}
                    transition={{ delay: 0.2 }}
                    className="mt-6 md:mt-12"
                  >
                    <motion.div
                      whileHover={{
                        scale: 1.02,
                        boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1)"
                      }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-md hover:cursor-pointer border border-neutral-100 dark:border-gray-700 text-center flex items-center justify-center transition-all duration-300 ease-in-out min-h-auto md:min-h-[400px] transform-gpu"
                    >
                      <p className="text-neutral-600 dark:text-gray-300 text-sm md:text-base lg:text-xl leading-relaxed">
                        Our platform offers comprehensive tools for connection, growth, and inspiration. Real-time Chat provides instant text, voice, and video communication to stay connected. The Mentorship program facilitates meaningful, cross-generational relationships by pairing those seeking guidance with those who can provide it. Finally, the Share Stories feature allows members to celebrate successes and inspire others with their unique journeys, fostering a strong sense of community.
                      </p>
                    </motion.div>
                  </motion.div>
                </motion.div>
                <motion.div
                  variants={slideInRight}
                  transition={{ delay: 0.1 }}
                  className="lg:w-1/2 flex justify-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden rounded-md shadow-lg transform-gpu"
                  >
                    <Image
                      src={connect}
                      alt="Phone"
                      width={580}
                      height={576}
                      className="w-full max-w-md md:max-w-lg lg:max-w-none h-auto object-cover"
                    />
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Face-to-Face Section */}
        <section className="box-border caret-transparent py-10 md:py-20 bg-white dark:bg-gray-900">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-50px" }}
            variants={fadeInUp}
            className="[align-items:normal] box-border caret-transparent block max-w-[1800px] mx-auto lg:items-center lg:flex"
          >
            <div className="relative box-border caret-transparent basis-auto list-none min-h-0 min-w-0 z-[1] overflow-hidden mx-auto lg:basis-[66.6667%] lg:min-h-[auto] lg:min-w-[auto]">
              <div className="relative caret-transparent flex h-full w-full z-[1]">
                <div className="relative box-border caret-transparent shrink-0 h-full w-full">
                  <div className="box-border caret-transparent">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden rounded-sm lg:ml-4 transform-gpu"
                    >
                      <Image
                        src={happy}
                        width={1200}
                        height={800}
                        className="box-border caret-transparent w-full"
                        alt="Video Call"
                      />
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
            <motion.div
              variants={slideInRight}
              transition={{ delay: 0.2 }}
              className="box-border caret-transparent block basis-auto flex-row justify-normal min-h-0 min-w-0 pt-5 pb-5 md:pb-[35px] px-4 md:px-[6.25%] lg:flex lg:basis-[33.3333%] lg:flex-col lg:justify-center lg:min-h-[auto] lg:min-w-[auto] lg:pt-[35px] lg:px-[4.16667%]"
            >
              <div className="box-border caret-transparent min-h-0 min-w-0 mb-2.5 lg:min-h-[auto] lg:min-w-[auto]">
                <h3 className="text-green-700 dark:text-green-400 text-xl md:text-2xl lg:text-3xl box-border caret-transparent leading-[30px] md:leading-[36.0022px] font-medium">
                  Face-to-Face Connections
                </h3>
              </div>
              <div className="box-border caret-transparent min-h-0 min-w-0 mb-4 md:mb-[15px] lg:min-h-[auto] lg:min-w-[auto]">
                <p className="text-base box-border caret-transparent leading-relaxed text-neutral-600 dark:text-gray-400 md:text-lg">
                  Experience the warmth of family through high-quality video calls. Share laughter, stories, and create new memories together in real-time.
                </p>
              </div>
              <div className="box-border caret-transparent min-h-0 min-w-0 lg:min-h-[auto] lg:min-w-[auto]">
                <motion.a
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  href="#"
                  className="relative text-orange-600 dark:text-orange-400 text-base font-medium box-border caret-transparent tracking-[0.3px] leading-[22.0014px] hover:text-neutral-600 dark:hover:text-gray-300 hover:underline inline-flex items-center gap-2 transform-gpu"
                >
                  Start Video Call
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                    className="text-lg"
                  >
                    →
                  </motion.span>
                </motion.a>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Community Stories */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-50px" }}
          variants={scaleIn}
          className="bg-gradient-to-r from-green-800 to-green-900 dark:from-green-900 dark:to-green-950 box-border caret-transparent max-w-[1800px] mx-auto my-10 md:my-20 rounded-lg overflow-hidden transform-gpu"
        >
          <div className="box-border caret-transparent text-center px-4 md:px-[6.25%] py-8 md:py-10 lg:py-[75px]">
            <motion.div
              variants={fadeIn}
              className="box-border caret-transparent mb-4 md:mb-[15px] lg:mb-5"
            >
              <h2 className="text-white text-2xl md:text-3xl lg:text-4xl box-border caret-transparent leading-[32px] md:leading-[38.0016px] font-light">
                Share Your Journey
              </h2>
            </motion.div>
            <motion.div
              variants={fadeIn}
              transition={{ delay: 0.1 }}
              className="box-border caret-transparent mb-4 md:mb-5"
            >
              <p className="text-white/80 text-base box-border caret-transparent leading-relaxed md:text-lg max-w-2xl mx-auto">
                Every story matters. Share your experiences, challenges, and triumphs with the ASYV family worldwide.
              </p>
            </motion.div>
            <motion.div
              variants={fadeIn}
              transition={{ delay: 0.2 }}
              className="box-border caret-transparent"
            >
              <motion.a
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                href="#"
                className="relative text-white text-base font-medium box-border caret-transparent tracking-[0.3px] leading-[22.0014px] inline-flex items-center gap-2 bg-green-700 dark:bg-green-600 px-6 py-3 rounded-md hover:bg-green-600 dark:hover:bg-green-700 transition-all duration-300 transform-gpu"
              >
                Share Your Story
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="text-lg"
                >
                  ↻
                </motion.span>
              </motion.a>
            </motion.div>
          </div>
        </motion.section>

        {/* Mentorship Section */}
        <section className="box-border caret-transparent max-w-[1800px] mx-auto py-10 md:py-20 bg-white dark:bg-gray-900">
          <div className="box-border caret-transparent px-4 md:px-[8.33333%]">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, margin: "-50px" }}
              variants={fadeInUp}
              className="box-border caret-transparent block mb-6 md:mb-[25px] lg:flex lg:mb-[15px]"
            >
              <div className="box-border caret-transparent basis-auto shrink min-h-0 min-w-0 w-auto -mb-2.5 lg:basis-3/5 lg:shrink-0 lg:min-h-[auto] lg:min-w-[auto] lg:w-3/5">
                <h2 className="text-neutral-800 dark:text-gray-200 text-2xl md:text-3xl lg:text-4xl box-border caret-transparent leading-[36px] md:leading-[46.0008px] font-light">
                  Find Your Mentor
                </h2>
              </div>
            </motion.div>
            <div className="box-border caret-transparent block lg:flex gap-8">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false }}
                variants={slideInLeft}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="relative box-border caret-transparent basis-auto shrink h-auto min-h-0 min-w-0 w-auto pb-6 md:pb-[25px] lg:basis-3/5 lg:shrink-0 lg:h-full lg:min-h-[auto] lg:min-w-[auto] lg:w-3/5 lg:pb-0 transform-gpu"
              >
                <div className="box-border caret-transparent mb-6 md:mb-[23px] lg:mb-0 lg:mx-0 overflow-hidden rounded-lg">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.5 }}
                    className="transform-gpu"
                  >
                    <Image
                      src={jesi}
                      width={800}
                      height={600}
                      alt="Mentorship"
                      className="aspect-square box-border caret-transparent object-cover w-full rounded-lg"
                    />
                  </motion.div>
                </div>
              </motion.div>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false }}
                variants={slideInRight}
                transition={{ delay: 0.2 }}
                className="box-border caret-transparent lg:basis-2/5 flex flex-col justify-center"
              >
                <h3 className="text-orange-500 dark:text-orange-400 text-xl md:text-2xl lg:text-3xl box-border caret-transparent leading-[30px] md:leading-[36.0022px] font-medium mb-4">
                  Guidance That Transforms
                </h3>
                <p className="text-base box-border caret-transparent leading-relaxed text-neutral-600 dark:text-gray-400 md:text-lg mb-6">
                  Connect with experienced mentors who can guide you through career choices, personal growth, and life challenges.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(21, 128, 61, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-green-800 dark:bg-green-700 text-white text-base font-medium px-6 py-3 rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-all duration-300 transform-gpu"
                >
                  Become a Mentor
                </motion.button>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 dark:bg-black box-border caret-transparent w-full transition-colors duration-300">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-50px" }}
          variants={fadeInUp}
          className="box-border caret-transparent max-w-[1800px] mx-auto"
        >
          <div className="bg-none bg-repeat box-border caret-transparent bg-left-top pt-8 md:pt-10 pb-8 md:pb-[50px] px-4 md:px-[6.25%]">
            <div className="box-border caret-transparent flex flex-col flex-nowrap mb-8 md:mb-10 lg:flex-row lg:flex-wrap lg:mb-20">
              <div className="box-border caret-transparent block basis-auto shrink mr-0 mb-6 md:mb-[30px] lg:flex lg:basis-[40.4762%] lg:shrink-0 lg:mr-[7.14286%] lg:mb-0">
                <div className="box-border caret-transparent min-h-0 min-w-0 w-full mb-5 lg:min-h-[auto] lg:min-w-[auto]">
                  <nav aria-label="tertiary" className="box-border caret-transparent flex justify-between">
                    <ul className="box-border caret-transparent basis-6/12 list-none pl-0 lg:basis-[35%]">
                      {["About ASYV", "Community Guidelines", "Privacy Policy"].map((item, index) => (
                        <motion.li
                          key={item}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: false }}
                          transition={{ delay: index * 0.1 }}
                          className="text-base box-border caret-transparent leading-[28.0008px] mb-4 pr-5 lg:pr-0"
                        >
                          <motion.a
                            whileHover={{ x: 5 }}
                            href="#"
                            className="text-neutral-400 dark:text-gray-500 text-sm box-border caret-transparent leading-[28.0008px] hover:text-white dark:hover:text-gray-300 transition-all duration-300 inline-block"
                          >
                            {item}
                          </motion.a>
                        </motion.li>
                      ))}
                    </ul>
                    <ul className="box-border caret-transparent basis-6/12 list-none pl-0 lg:basis-[35%]">
                      {["Contact", "Support", "FAQ"].map((item, index) => (
                        <motion.li
                          key={item}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: false }}
                          transition={{ delay: index * 0.1 + 0.15 }}
                          className="text-base box-border caret-transparent leading-[28.0008px] mb-4 pr-5 lg:pr-0"
                        >
                          <motion.a
                            whileHover={{ x: 5 }}
                            href="#"
                            className="text-neutral-400 dark:text-gray-500 text-sm box-border caret-transparent leading-[28.0008px] hover:text-white dark:hover:text-gray-300 transition-all duration-300 inline-block"
                          >
                            {item}
                          </motion.a>
                        </motion.li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ delay: 0.3 }}
                className="box-border caret-transparent basis-auto grow-0 shrink ml-0 lg:basis-[30.9524%] lg:grow lg:shrink-0 lg:ml-auto"
              >
                <div className="text-neutral-400 dark:text-gray-500 box-border caret-transparent">
                  <p className="text-sm box-border caret-transparent leading-relaxed">
                    ASYV Community Platform<br />
                    Connecting Families Worldwide<br />
                    Building Futures Together<br />
                  </p>
                </div>
              </motion.div>
            </div>
            <div className="box-border caret-transparent flex flex-col flex-nowrap justify-between lg:flex-row lg:flex-wrap">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: false }}
                className="items-center box-border caret-transparent flex max-w-[250px] mb-6 md:mb-10 mx-auto lg:mb-0 lg:mx-0"
              >
                <div className="text-white dark:text-gray-300 text-center">
                  <div className="text-xl font-light">ASYV</div>
                  <div className="text-xs tracking-widest">COMMUNITY</div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: false }}
                transition={{ delay: 0.2 }}
                className="box-border caret-transparent"
              >
                <div className="text-neutral-500 dark:text-gray-600 box-border caret-transparent leading-[26px] text-center text-sm lg:text-right">
                  © 2025 ASYV Community Platform. All rights reserved.
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}