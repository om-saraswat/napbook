import React from 'react'
import PostForm from '../../components/PostForm'

const CreatePost = () => {
  return (
    <div className='flex flex-1'>
       <div className='comman-container '>
        <div className='max-w-5xl flex-start gap-3 justify-start w-full'>
          <img 
          src="/assets/icons/add-post.svg" 
          alt="createpostimage"
          width={36}
          height={37}
           />
          <h2 className='h3-bold md:h2-bold text-left w-full'>Create Post</h2>
        </div>
        <PostForm/>
       </div>
    </div>
  )
}

export default CreatePost