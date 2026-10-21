import type { ReviewPhoto } from "../../api/reviews";

type Props = {
  photos: ReviewPhoto[];
};

export default function ReviewPhotos({ photos }: Props) {
  if (photos.length === 0) return null;

  return (
    <ul className="mt-3 grid grid-cols-3 gap-2" aria-label="Фото відгуку">
      {photos.map((photo, index) => (
        <li key={photo.id}>
          <a
            href={photo.photoUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Відкрити фото відгуку ${index + 1} у новій вкладці`}
            className="block overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <img
              src={photo.photoUrl}
              alt={`Фото до відгуку ${index + 1}`}
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
