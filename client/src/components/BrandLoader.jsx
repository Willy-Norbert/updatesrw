import { useTheme } from '../context/ThemeContext';

export default function BrandLoader({ full = true, label = 'Loading Updaterw' }) {
  const { theme } = useTheme();
  const src = theme === 'dark' ? '/loader-dark.mp4' : '/loader-light.mp4';

  return (
    <div className={full ? 'loader-screen' : 'grid place-items-center py-10'}>
      <div className="text-center">
        <video className="loader-video" src={src} autoPlay muted loop playsInline />
        <p className="mt-2 text-[10px] tracking-[0.18em] uppercase text-[var(--text-soft)]">{label}</p>
      </div>
    </div>
  );
}
