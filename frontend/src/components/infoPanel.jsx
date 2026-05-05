function InfoPanel({ data, viewerSettings, zoom }) {
  return (
    <div className="w-full">
      <div className="w-full min-h-40"></div>
      <div className="">
        <svg
          id="wave-1"
          width="100%"
          height="200"
          viewBox="0 0 680 200"
          preserveAspectRatio="xMidYMid slice"
          className="absolute bottom-0 left-0 pointer-events-none"
        >
          <path
            d="M 0 86 C 80 66 160 101 240 82 C 330 55 391 101 530 82 C 554 77 601 72 680 86 L 680 207 L 0 207 Z"
            fill="#0e4f7a"
          />
          <path
            d="M 0 102 C 90 82 170 115 260 96 C 340 78 403 121 569 86 C 611 77 660 102 680 98 L 680 207 L 0 207 Z"
            fill="#079aaa"
          />
        </svg>
        <svg
          id="wave-2"
          width="100%"
          height="200"
          viewBox="0 0 680 200"
          preserveAspectRatio="xMidYMid slice"
          className="absolute bottom-0 left-0 pointer-events-none"
        >
          <path
            d="M 0 117 C 100 97 160 138 280 110 C 370 92 450 120 530 102 C 590 88 640 105 680 110 L 680 207 L 0 207 Z"
            fill="#00e0e0"
            opacity="0.85"
          />
        </svg>

        <div className="absolute bottom-0 left-0 text-slate-900 p-2 w-full flex flex-row text-md items-center gap-3">
          <div className="font-bold">Gene: {data.metadata.gene_name}</div>
          <div className="text-sm">
            {data.metadata.gene_id}
            <br />
            {data.metadata.chr} {data.metadata.start.toLocaleString()}
            &nbsp;—&nbsp;
            {data.metadata.end.toLocaleString()}
          </div>
          <div className="flex-1"></div>
          <div className="text-lg">{Math.round(viewerSettings.scale)}%</div>
          <button
            className="text-xl min-w-8 min-h-8 bg-white rounded-md border-2 border-gray-500 cursor-pointer"
            onClick={() => zoom(1.25)}
          >
            +
          </button>
          <button
            className="text-xl min-w-8 min-h-8 bg-white rounded-md border-2 border-gray-500 cursor-pointer"
            onClick={() => zoom(1 / 1.25)}
          >
            –
          </button>
        </div>
      </div>
    </div>
  );
}

export default InfoPanel;
