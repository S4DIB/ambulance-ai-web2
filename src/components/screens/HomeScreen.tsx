import React from 'react';
import LoginScreen from './LoginScreen';
import DashboardScreen from './DashboardScreen';

interface HomeScreenProps {
  updateState: (updates: any) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ updateState }) => {
  const state = (window as any).state;
  const isLoggedIn = state.isLoggedIn;

  // If not logged in, show login screen
  if (!isLoggedIn) {
    return <LoginScreen updateState={updateState} />;
  }

  // If logged in, show dashboard
  return <DashboardScreen updateState={updateState} />;
};

export default HomeScreen;