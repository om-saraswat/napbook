import { useState } from 'react'
import {Routes , Route} from 'react-router-dom'
import './index.css'
import SigninForm from './auth/forms/SigninForm';
import SignupForm from './auth/forms/SignupForm';
import { Home } from './root/pages';
import AuthLayout from './auth/forms/AuthLayout';
import RootLayout from './root/pages/RootLayout';
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
          <Route index element={<Home/>}>
        </Route></Route>
        
      </Routes>
      <Toaster />
    </main>
  );
}

export default App
