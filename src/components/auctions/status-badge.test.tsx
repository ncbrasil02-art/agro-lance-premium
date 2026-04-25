import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
 import { StatusBadge } from './status-badge';
 
 describe('StatusBadge', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

   it('renders correctly for "live" status', () => {
     render(<StatusBadge status="live" />);
     expect(screen.getByText('AO VIVO')).toBeInTheDocument();
   });
 
   it('renders correctly for "upcoming" status', () => {
     render(<StatusBadge status="upcoming" />);
     expect(screen.getByText('EM BREVE')).toBeInTheDocument();
   });
 
   it('renders correctly for "closed" status', () => {
     render(<StatusBadge status="closed" />);
     expect(screen.getByText('ENCERRADO')).toBeInTheDocument();
   });
 
   it('renders correctly for "sold" status', () => {
     render(<StatusBadge status="sold" />);
     expect(screen.getByText('ARREMATADO')).toBeInTheDocument();
   });
 
   it('handles null status safely', () => {
     render(<StatusBadge status={null} />);
     expect(screen.getByText('Pendente')).toBeInTheDocument();
   });
 
   it('handles undefined status safely', () => {
     render(<StatusBadge status={undefined} />);
     expect(screen.getByText('Pendente')).toBeInTheDocument();
   });
 
   it('handles unknown status string', () => {
     render(<StatusBadge status="unknown_status" />);
     expect(screen.getByText('unknown_status')).toBeInTheDocument();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Unknown status received: "unknown_status"')
    );
  });

  it('handles uppercase status strings', () => {
    render(<StatusBadge status="LIVE" />);
    expect(screen.getByText('AO VIVO')).toBeInTheDocument();
  });

  it('handles empty string status', () => {
    render(<StatusBadge status="" />);
    expect(screen.getByText('Pendente')).toBeInTheDocument();
   });
 
   it('applies custom className', () => {
     const { container } = render(<StatusBadge status="live" className="custom-class" />);
     expect(container.firstChild).toHaveClass('custom-class');
   });
 });