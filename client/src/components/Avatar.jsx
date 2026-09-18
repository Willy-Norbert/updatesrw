export default function Avatar({ user, size = 36 }) {
  const src = user?.profileImage || '/default-avatar.svg';
  return (
    <img
      src={src}
      alt={user?.fullName || user?.username || 'User'}
      width={size}
      height={size}
      className="object-cover bg-[var(--navy)]"
      style={{ width: size, height: size, borderRadius: 8 }}
    />
  );
}
