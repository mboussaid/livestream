import React, { useState } from 'react'
import TextInput from '../../components/TextInput/TextInput'
import Button from '../../components/Buttons/Button'

function Code() {
  const [code, setCode] = useState('')
  return (
    <div>
      <TextInput
        label='Code'
        placeholder='Enter 6 digit code'
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <Button />
    </div>
  )
}

export default Code
