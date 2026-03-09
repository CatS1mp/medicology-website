import Image from "next/image";

export default function ImagesPage() {
    const images = Array.from({ length: 27 }, (_, i) => i + 1);

    return (
        <div className="grid grid-cols-4 gap-4 p-4">
            {images.map((num) => (
                <div key={num} className="border p-2 flex flex-col items-center">
                    <p className="mb-2 font-bold">{num}.png</p>
                    <Image src={`/images/${num}.png`} alt={`Image ${num}`} width={150} height={150} />
                    <p className="mt-4 mb-2 font-bold">{num}.svg</p>
                    <Image src={`/images/${num}.svg`} alt={`Image ${num}`} width={150} height={150} />
                </div>
            ))}
        </div>
    );
}
