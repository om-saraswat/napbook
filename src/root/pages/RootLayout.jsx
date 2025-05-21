import React from 'react'
import Topbar from '../../components/shared/Topbar'
import Leftsidebar from '../../components/shared/Leftsidebar'
import Bottombar from '../../components/shared/Bottombar'
import { Outlet } from 'react-router-dom'

const RootLayout = () => {
  return (
    <div className='w-full md:flex'>
      <Topbar/>
      <Leftsidebar/>
      
      <section className='flex flex-1 h-full'>
        <Outlet/>
      </section>


      <Bottombar/>
    </div>
  )
}

export default RootLayout