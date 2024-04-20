export function Galaxy({
  className,
  style,
  ...props
}: {
  className?: string;
  style?: React.CSSProperties;
} & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="114.412 186.255 89.669 89.669"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      {...props}
    >
      <path
        className="st0"
        d="M 182.353 237.772 C 182.409 236.976 183.1 236.377 183.895 236.433 C 184.691 236.489 185.29 237.18 185.234 237.975 C 184.462 248.749 180.132 257.074 173.704 262.733 C 167.369 268.31 159.014 271.272 150.037 271.418 C 150.128 271.049 150.198 270.675 150.245 270.298 C 150.32 269.701 150.339 269.109 150.306 268.527 C 158.483 268.327 166.059 265.613 171.795 260.563 C 177.675 255.387 181.639 247.727 182.353 237.772 Z M 147.374 269.937 C 147.794 266.603 145.7 263.387 142.363 262.493 C 138.745 261.524 135.027 263.648 134.018 267.245 C 134.011 267.271 134.004 267.297 133.997 267.323 C 133.021 270.967 135.183 274.713 138.827 275.689 C 142.471 276.665 146.217 274.503 147.193 270.859 C 147.276 270.552 147.336 270.244 147.374 269.937 Z M 127.842 214.206 C 128.811 210.588 126.687 206.87 123.09 205.861 C 123.064 205.854 123.038 205.847 123.012 205.84 C 119.368 204.864 115.622 207.026 114.646 210.67 C 113.67 214.314 115.832 218.06 119.476 219.036 C 119.783 219.118 120.091 219.178 120.398 219.217 C 123.732 219.638 126.948 217.543 127.842 214.206 Z M 171.118 192.241 C 170.698 195.575 172.792 198.791 176.129 199.685 C 179.747 200.654 183.465 198.53 184.474 194.933 C 184.481 194.907 184.488 194.881 184.495 194.855 C 185.471 191.211 183.309 187.465 179.665 186.489 C 176.021 185.513 172.275 187.675 171.299 191.319 C 171.216 191.626 171.156 191.934 171.118 192.241 Z M 198.094 242.961 C 194.76 242.541 191.544 244.635 190.65 247.972 C 189.681 251.59 191.805 255.308 195.402 256.317 C 195.428 256.324 195.454 256.331 195.48 256.338 C 199.124 257.314 202.87 255.152 203.846 251.508 C 204.822 247.864 202.66 244.118 199.016 243.142 C 198.709 243.059 198.401 242.999 198.094 242.961 Z M 146.751 227.741 C 144.902 234.642 148.997 241.735 155.898 243.584 C 162.799 245.433 169.892 241.338 171.741 234.437 C 173.59 227.536 169.495 220.443 162.594 218.594 C 155.693 216.745 148.6 220.84 146.751 227.741 Z M 152.563 254.196 C 142.608 253.483 134.948 249.518 129.771 243.637 C 124.721 237.901 122.007 230.325 121.807 222.148 C 121.225 222.181 120.633 222.163 120.036 222.087 C 119.659 222.039 119.285 221.97 118.916 221.879 C 119.062 230.857 122.024 239.212 127.601 245.546 C 133.26 251.974 141.585 256.305 152.359 257.076 C 153.155 257.132 153.845 256.533 153.901 255.737 C 153.957 254.941 153.358 254.252 152.563 254.196 Z M 122.718 202.828 C 123.703 200.479 124.883 198.151 126.262 195.869 C 128.066 192.882 130.211 189.974 132.705 187.199 C 133.239 186.606 134.152 186.558 134.744 187.092 C 135.337 187.626 135.385 188.539 134.851 189.131 C 132.484 191.765 130.448 194.525 128.735 197.361 C 127.481 199.437 126.4 201.555 125.49 203.693 C 124.977 203.444 124.436 203.236 123.869 203.077 C 123.832 203.067 123.796 203.057 123.759 203.047 C 123.413 202.953 123.065 202.881 122.718 202.828 Z M 136.139 224.406 C 136.083 225.202 135.392 225.801 134.597 225.745 C 133.801 225.689 133.202 224.998 133.258 224.203 C 134.03 213.429 138.36 205.104 144.788 199.445 C 151.123 193.868 159.478 190.906 168.455 190.76 C 168.364 191.129 168.294 191.503 168.247 191.88 C 168.172 192.477 168.153 193.069 168.186 193.651 C 160.009 193.851 152.433 196.565 146.697 201.615 C 140.817 206.791 136.853 214.451 136.139 224.406 Z M 187.507 194.561 C 189.856 195.546 192.184 196.726 194.466 198.104 C 197.453 199.908 200.361 202.053 203.136 204.547 C 203.729 205.081 203.777 205.994 203.243 206.586 C 202.709 207.179 201.796 207.227 201.204 206.693 C 198.57 204.326 195.81 202.29 192.974 200.577 C 190.898 199.323 188.78 198.242 186.643 197.332 C 186.892 196.819 187.1 196.278 187.259 195.711 C 187.269 195.674 187.279 195.638 187.289 195.601 C 187.382 195.256 187.454 194.908 187.507 194.561 Z M 165.929 207.982 C 175.884 208.695 183.544 212.66 188.721 218.541 C 193.771 224.277 196.485 231.853 196.685 240.03 C 197.267 239.997 197.859 240.015 198.456 240.091 C 198.833 240.138 199.207 240.208 199.576 240.299 C 199.43 231.321 196.468 222.966 190.891 216.632 C 185.232 210.204 176.907 205.873 166.133 205.102 C 165.337 205.046 164.647 205.645 164.591 206.441 C 164.534 207.236 165.134 207.926 165.929 207.982 Z M 195.774 259.35 C 195.426 259.297 195.079 259.225 194.732 259.132 C 194.695 259.122 194.658 259.112 194.622 259.102 C 194.055 258.943 193.514 258.736 193.001 258.486 C 192.091 260.624 191.01 262.741 189.756 264.817 C 188.043 267.653 186.008 270.413 183.64 273.047 C 183.106 273.64 183.155 274.553 183.747 275.086 C 184.34 275.62 185.253 275.571 185.786 274.979 C 188.28 272.204 190.425 269.296 192.229 266.309 C 193.609 264.027 194.789 261.699 195.774 259.35 Z M 130.985 267.617 C 128.636 266.632 126.308 265.452 124.026 264.074 C 121.039 262.27 118.131 260.125 115.356 257.631 C 114.763 257.097 114.715 256.184 115.249 255.592 C 115.783 254.999 116.696 254.951 117.288 255.485 C 119.922 257.852 122.682 259.888 125.518 261.601 C 127.594 262.855 129.712 263.935 131.85 264.846 C 131.601 265.359 131.393 265.9 131.234 266.467 C 131.224 266.504 131.214 266.54 131.204 266.577 C 131.11 266.922 131.038 267.27 130.985 267.617 Z"
        style={{
          clipRule: "evenodd",
          fillRule: "evenodd",
        }}
      />
    </svg>
  );
}
