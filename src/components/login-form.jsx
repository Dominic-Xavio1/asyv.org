"use client";

import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTableDemo } from "./table-data"
import {useUserStore} from "../stores/userStore"
import { LoaderIcon } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import {redirect} from 'next/navigation'
import {useRouter} from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field.jsx"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

export function LoginForm({
  className,
  ...props
}) {
  const [mode, setMode] = useState("signin")
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isDisabled, setIsDisabled] = useState(false);
  const [loginCredentails, setLoginCredentials] = useState({
    email:"",
    password:""
  });
  const searchParams = useSearchParams()

  useEffect(() => {
    const q = searchParams?.get?.("mode")
    if (q === "signup") setMode("signup")
  }, [searchParams])
useEffect(()=>{
if(loginCredentails.email&&loginCredentails.password){
  setIsDisabled(true);
}
},[loginCredentails])

const {currentUser,setCurrentUser} = useUserStore();
const { login: authLogin } = useAuth();

const loginUser = async()=>{
  setIsLoading(true);
  try{
    const response = await fetch("/api/login",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify(loginCredentails)
    });
    const data = await response.json();
    
    if(data.error){
      toast.error(`Login Failed: ${data.error}`,{duration:5000});
      setIsLoading(false);
      return;
    }
    
    if(data.user && data.token){
      setCurrentUser(data.user);
      authLogin(data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("fullInfo", JSON.stringify(data.fullInfo));
      localStorage.setItem("second_name", JSON.stringify(data.user.second_name)); 
      toast.success(`Welcome back, ${data.user.username}!`, {duration:3000});
  
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } 
  }catch(err){
    console.error("Login Error:", err);
    toast.error("An error occurred. Please try again.");
    setIsLoading(false);
  }
}

  useEffect(()=>{
    if(mode==="signup"){
      async function LoadUsers(){
        const users = await fetch("/api/users");
        const data = await users.json();
        console.log("Fetched Users on Signup:",data);
      }
      LoadUsers()
    }
    else{
      async function TestAPI(){
        const response = await fetch("/api/test");
        const data = await response.json();
        console.log("Test API Response on Signin:",data);
      }
    }
  },[mode])

  const switchTo = (m) => () => setMode(m)

  const variants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  }

  return (
    <div className={cn("flex flex-col gap-4 sm:gap-6 px-4 sm:px-0", className)} {...props}>
      <Card className="overflow-hidden p-0 dark:bg-gray-900 dark:border-gray-700 w-full lg:w-[1000px] mx-auto">
        <CardContent className="grid p-0 lg:grid-cols-2">
          <form className="p-4 sm:p-6 lg:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-500 dark:text-orange-400">
                  {mode === "signin" ? "Welcome Back" : "Join ASYV"}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-balance text-xs sm:text-sm lg:text-base px-2">
                  {mode === "signin" ? "Sign in to your ASYV Community account" : "Create your ASYV Community account"}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {mode === "signin" ? (
                  <motion.div key="signin" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28 }}>
                    <Field>
                      <FieldLabel className="text-gray-800 dark:text-gray-200 text-sm sm:text-base" htmlFor="email">Email</FieldLabel>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="student@asyv.org" 
                        onChange={(e)=>{
                          setLoginCredentials({...loginCredentails,
                          email:e.target.value
                        })
                        }}
                        required 
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 dark:focus:border-orange-400 text-sm sm:text-base h-10 sm:h-11"
                      />
                    </Field>
                    <Field>
                      <div className="flex items-center">
                        <FieldLabel className="text-gray-800 dark:text-gray-200 text-sm sm:text-base" htmlFor="password">Password</FieldLabel>
                        <a href="#" className="ml-auto text-xs sm:text-sm text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 underline-offset-2 hover:underline">
                          Forgot password?
                        </a>
                      </div>
                      <Input 
                        id="password" 
                        type="password" 
                        onChange={(e)=>{
                          setLoginCredentials({...loginCredentails,
                          password:e.target.value
                        })
                        }}
                        required 
                        className="bg-white dark:bg-gray-800 mb-3 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 dark:focus:border-orange-400 text-sm sm:text-base h-10 sm:h-11"
                      />
                    </Field>
                    <Field>
                      <Button
                        onClick={(e)=>{
                          e.preventDefault();
                          setIsLoading(true)
                          loginUser();
                          console.log("Login Credentials:",loginCredentails);
                        }}
                        className="w-full bg-green-700 dark:bg-green-600 hover:bg-green-800 dark:hover:bg-green-700 text-white text-sm sm:text-base py-2.5 sm:py-3 h-auto hover:cursor-pointer"
                      >
                        {isLoading?<>Loading... <Spinner className="size-4 sm:size-6 text-yellow-500 ml-2" /></>:<>Sign In</>}
                      </Button>
                    </Field>
                  </motion.div>
                ) : (
                  <motion.div key="signup" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28 }}>
                    <Field>
                      <FieldLabel className="text-gray-800 dark:text-gray-200 text-sm sm:text-base" htmlFor="username">Username</FieldLabel>
                      <Input 
                        id="username" 
                        type="text" 
                        placeholder="your_username" 
                        required 
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 dark:focus:border-orange-400 text-sm sm:text-base h-10 sm:h-11"
                      />
                    </Field>
                    <Field>
                      <FieldLabel className="text-gray-800 dark:text-gray-200 text-sm sm:text-base" htmlFor="fullname">Full Name</FieldLabel>
                      <Input 
                        id="fullname" 
                        type="text" 
                        placeholder="John Doe" 
                        required 
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 dark:focus:border-orange-400 text-sm sm:text-base h-10 sm:h-11"
                      />
                    </Field>
                    <Field>
                      <FieldLabel className="text-gray-800 dark:text-gray-200 text-sm sm:text-base" htmlFor="grade">Grade Level</FieldLabel>
                      <Input 
                        id="grade" 
                        type="text" 
                        placeholder="Grade 10" 
                        required 
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 dark:focus:border-orange-400 text-sm sm:text-base h-10 sm:h-11"
                      />
                    </Field>
                    <Field>
                      <FieldLabel className="text-gray-800 dark:text-gray-200 text-sm sm:text-base" htmlFor="email">Email</FieldLabel>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="student@asyv.org" 
                        required 
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 dark:focus:border-orange-400 text-sm sm:text-base h-10 sm:h-11"
                      />
                    </Field>
                    <Field>
                      <FieldLabel className="text-gray-800 dark:text-gray-200 text-sm sm:text-base" htmlFor="password">Password</FieldLabel>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="Minimum 8 characters" 
                        required 
                        className="bg-white dark:bg-gray-800 border-gray-300 mb-3 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 dark:focus:border-orange-400 text-sm sm:text-base h-10 sm:h-11"
                      />
                    </Field>
                    <Field>
                      <Button type="submit" className="w-full bg-green-700 dark:bg-green-600 hover:bg-green-800 dark:hover:bg-green-700 text-white text-sm sm:text-base py-2.5 sm:py-3 h-auto">
                        Create Account
                      </Button>
                    </Field>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <FieldSeparator className="pointer-events-auto my-3 sm:my-4">
                <a href="mailto:dominicxavio09@gmail.com" className="text-blue-600 underline hover:text-blue-800 text-xs sm:text-sm">
                  Check with our tech team.
                </a>
              </FieldSeparator>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-gray-200 dark:*:data-[slot=field-separator-content]:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs sm:text-sm my-3 sm:my-4">
                Or continue with
              </FieldSeparator>
              
              <Field className="grid grid-cols-3 gap-2 sm:gap-3">
                <Button 
                  variant="outline" 
                  type="button"
                  className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 sm:p-3 h-10 sm:h-11"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5">
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="currentColor" />
                  </svg>
                  <span className="sr-only">Login with Apple</span>
                </Button>
                <Button 
                  variant="outline" 
                  type="button"
                  className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 sm:p-3 h-10 sm:h-11"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor" />
                  </svg>
                  <span className="sr-only">Login with Google</span>
                </Button>
                <Button 
                  variant="outline" 
                  type="button"
                  className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 sm:p-3 h-10 sm:h-11"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5">
                    <path
                      d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
                      fill="currentColor" />
                  </svg>
                  <span className="sr-only">Login with Meta</span>
                </Button>
              </Field>
              
              <FieldDescription className="text-center text-gray-600 dark:text-gray-400 text-xs sm:text-sm lg:text-base mt-3 sm:mt-4">
                {mode === "signin" ? (
                  <>Don't have an account? <button type="button" onClick={switchTo("signup")} className="text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 font-medium">Sign up</button></>
                ) : (
                  <>Already have an account? <button type="button" onClick={switchTo("signin")} className="text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 font-medium">Sign in</button></>
                )}
              </FieldDescription>
            </FieldGroup>
          </form>

          {/* Desktop Table / Illustration View */}
          <div className="bg-gray-100 dark:bg-gray-800 relative hidden lg:block border-l border-gray-200 dark:border-gray-700">
            <div className="p-4 h-full">
              {mode === "signup" ? (
                <DataTableDemo className="h-full" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="max-w-xs text-center px-4">
                    <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 max-w-full h-auto">
                      <rect width="180" height="140" rx="12" fill="#E6F4EA" />
                      <circle cx="50" cy="50" r="24" fill="#10B981" />
                      <rect x="88" y="34" width="76" height="18" rx="4" fill="#34D399" />
                      <rect x="88" y="62" width="76" height="10" rx="3" fill="#BBF7D0" />
                      <rect x="20" y="92" width="140" height="28" rx="6" fill="#34D399" />
                    </svg>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Welcome to ASYV</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Sign in to continue, or switch to Sign up to browse the student directory.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Table Sheet */}
          <div className="lg:hidden p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm sm:text-base h-10 sm:h-11">
                  <Menu className="mr-2 h-4 w-4" />
                  View Student Directory
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div className="h-full overflow-auto">
                  {mode === "signup" ? (
                    <DataTableDemo />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center p-4 sm:p-6">
                      <div className="text-center">
                        <svg width="120" height="90" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-3 max-w-full h-auto">
                          <rect width="120" height="90" rx="10" fill="#F3F4F6" />
                          <circle cx="36" cy="36" r="16" fill="#60A5FA" />
                          <rect x="64" y="28" width="40" height="10" rx="4" fill="#93C5FD" />
                          <rect x="64" y="48" width="40" height="8" rx="4" fill="#BFDBFE" />
                        </svg>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Switch to Sign up to view the student directory.</div>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardContent>
      </Card>
      
      <FieldDescription className="px-4 sm:px-6 text-center text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
        By clicking continue, you agree to our <a href="#" className="text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400">Terms of Service</a>{" "}
        and <a href="#" className="text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}