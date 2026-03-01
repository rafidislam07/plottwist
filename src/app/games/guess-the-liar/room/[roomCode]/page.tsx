import { RoomScreen } from "@/features/guess-the-liar/components/RoomScreen";

type RoomPageProps = {
  params: Promise<{
    roomCode: string;
  }>;
  searchParams: Promise<{
    rejoined?: string;
  }>;
};

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const { roomCode } = await params;
  const { rejoined } = await searchParams;
  const normalizedRoomCode = roomCode.toUpperCase();
  const joinedAgainOnThisDevice = rejoined === "1";

  return (
    <RoomScreen
      roomCode={normalizedRoomCode}
      joinedAgainOnThisDevice={joinedAgainOnThisDevice}
    />
  );
}
