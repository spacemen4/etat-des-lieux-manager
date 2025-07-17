import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReleveCompteursStep from './ReleveCompteursStep';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    storage: {
      from: jest.fn().mockReturnThis(),
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
    },
  },
}));

const mockRef = {
  current: {
    saveData: jest.fn(),
  },
};

describe('ReleveCompteursStep', () => {
  it('should render without crashing', () => {
    render(<ReleveCompteursStep etatId="1" ref={mockRef} />);
    expect(screen.getByText(/Relevé des compteurs/i)).toBeInTheDocument();
  });
});
