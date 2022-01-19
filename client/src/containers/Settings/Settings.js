import React, { useState, useEffect } from 'react'
import Button from '../../components/Buttons/Button'
import Navbar from '../../components/Navbar/Navbar'
import TextArea from '../../components/TextArea/TextArea'
import getCookie from '../../utils/getCookie'
import './Settings.css'

function Settings() {
  const [email, setemail] = useState('')
  const [text, settext] = useState('')

  useEffect(() => {
    setemail(getCookie('userEmail'))
  }, [])

  const onSubmitHandler = () => {
    alert('submit')
  }
  return (
    <>
      <Navbar />
      <div style={{ margin: '3rem auto', width: '60%' }}>
        <h2>Settings</h2>
        <p>
          You are currently on the <b>FREE TIER</b>
        </p>
        <p>
          Your email: <b>{email}</b>
        </p>
        <br></br>
        <div style={{ width: '80%' }}>
          <TextArea
            label='Have a question about your account? Send us an email here.'
            value={text}
            onChange={(e) => settext(e.target.value)}
          />
          <Button title='Submit' fx={onSubmitHandler} />
        </div>
      </div>
    </>
  )
}

export default Settings
