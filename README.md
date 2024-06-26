# Project S

![project s screenshot](/splash.png)

> [!IMPORTANT]
> This project is in its infancy, so be a little patient with it. Please don't hesistate to open an issue if you find any bugs or want to suggest tweaks.

A super duper original (totally revolutionary) space game inspired by games like Neptune's Pride. Created with next.js (zustand, tailwind, konva, framer-motion) on the frontend, python (asyncio, motor, beanie, sanic) on the backend, assuming MongoDB as a database.

## Getting Started

If you'd like to contruibute, tweak, or run your own local instance of Project S for whatever reason. The structure is a monorepo with `frontend` and `backend` packages. Database not included.

### Running the backend

> [!NOTE]
> Requires python 3.11 or higher

Navigate to the `backend` directory

```bash
cd ./packages/backend
```

Create `.env` with the following template

> [!IMPORTANT]
> You need a DB set up for this. Google is your friend and I am a lazy writer.

```env
MONGO_URL={database uri}
DEBUG=1
ENV=staging
OPENAI_TOKEN={open ai token if you want}
```

Create a virtual environment (optional but recommended to keep your system packages clean, requires virtualenv)

```bash
# Windows
py -m venv venv

# *nix
python3 -m venv venv
```

Activate the virtual environment

```bash
# Windows
./venv/Scripts/activate

# *nix
source ./venv/bin/activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Start the webserver

```bash
python3 main.py
```

Cool! Now let's get the frontend running so we can start a game!

### Running the frontend

> [!NOTE]
> Requires nodejs and npm or yarn or [insert trendy package manager]

Navigate to the `frontend` directory

```bash
cd ./packages/frontend
```

Create `.env.local` with the following template

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GATEWAY_URL=ws://localhost:8000
```

Install dependencies

```bash
npm install
# or
yarn install
# or whatever's hot right now
```

Start the dev webserver

```bash
npm run dev
# or
yarn dev
# ...
```

That's it! You should see the localhost url in your terminal and should be able to play a local game of Project S!
