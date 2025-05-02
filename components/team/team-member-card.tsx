import Image from "next/image"
import type { UserData } from "@/lib/firebase/users"

interface TeamMemberCardProps {
  member: UserData
}

export default function TeamMemberCard({ member }: TeamMemberCardProps) {
  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 w-48 rounded-full overflow-hidden mb-4">
        {member.photoURL ? (
          <Image
            src={member.photoURL || "/placeholder.svg"}
            alt={`${member.firstName} ${member.lastName}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-400">
              {member.firstName?.[0]}
              {member.lastName?.[0]}
            </span>
          </div>
        )}
      </div>
      <h3 className="text-xl font-bold text-center">
        {member.firstName} {member.lastName}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center mt-1">{member.country && `${member.country}`}</p>
    </div>
  )
}
