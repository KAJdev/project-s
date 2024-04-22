export function useImage(url: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new Image();
    img.src = url;
    img.onload = () => setImage(img);
    return () => {
      img.onload = null;
    };
  }, [url]);
  return image;
}
