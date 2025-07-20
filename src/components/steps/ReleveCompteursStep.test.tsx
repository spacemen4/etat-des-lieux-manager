import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReleveCompteursStep from './ReleveCompteursStep';
import { supabase } from '@/lib/supabase';
import { mock, describe, it, expect } from 'bun:test';

// Mock Supabase
mock.module('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => ({ data: null, error: null }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => ({ data: {}, error: null }),
          }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: () => ({ data: {}, error: null }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        upload: () => ({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'test-url' } }),
        remove: () => ({ data: null, error: null }),
      }),
    },
  },
}));

const mockRef = {
  current: {
    saveData: () => {},
  },
};

describe('ReleveCompteursStep', () => {
  it('should render without crashing', async () => {
    render(<ReleveCompteursStep etatId="1" ref={mockRef} />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /Relevé des compteurs/i })).toBeInTheDocument());
  });

  it('should allow adding a new photo', async () => {
    const { container } = render(<ReleveCompteursStep etatId="1" ref={mockRef} />);
    await waitFor(() => expect(screen.getAllByText(/Ajouter photos/i)[0]).toBeInTheDocument());

    const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });

    const input = container.querySelector('input[type="file"]');

    await waitFor(() => {
      fireEvent.change(input, {
        target: {
          files: [file],
        },
      });
    });

    await waitFor(() => expect(screen.getByText('chucknorris.png')).toBeInTheDocument());
  });

  it('should call saveData on save button click', () => {
    const saveData = mockRef.current.saveData;
    render(<ReleveCompteursStep etatId="1" ref={mockRef} />);
    fireEvent.click(screen.getAllByText(/Enregistrer le relevé/i)[0]);
    expect(saveData).toHaveBeenCalled();
  });
});
