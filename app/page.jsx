import React from 'react';
import AuthButton from './components/auth'; // relative path

export default function Home() {
  return (
    <div>
      <h1>Home Page</h1>
      <AuthButton />
    </div>
  );
}
