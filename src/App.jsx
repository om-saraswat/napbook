import { useState } from 'react'
import {Routes , Route} from 'react-router-dom'
import './index.css'
import SigninForm from './auth/forms/SigninForm';
import SignupForm from './auth/forms/SignupForm';
import { AllUsers, CreatePost, EditPost, Explore, Home, PostDetails, Profile, Saved, UpdateProfile } from './root/pages';
import AuthLayout from './auth/forms/AuthLayout';
import RootLayout from './root/RootLayout';
import { Toaster } from "@/components/ui/toaster"
function App() {
  return(
    <main className='flex h-screen w-screen'>
      <Routes>
        <Route element={<AuthLayout/>}>
          <Route path="/sign-in" element={<SigninForm/>}></Route>
          <Route path="/sign-up" element={<SignupForm/>}></Route>
        </Route>


        <Route element={<RootLayout/>}>
          <Route index element={<Home/>} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/all-users" element={<AllUsers />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/update-post/:id" element={<EditPost />} />
          <Route path="/posts/:id" element={<PostDetails />} />
          <Route path="/profile/:id/*" element={<Profile />} />
          <Route path="/update-profile/:id" element={<UpdateProfile />} />
        </Route>
        
      </Routes>
      <Toaster />
    </main>
  );
}

export default App


// 3:00