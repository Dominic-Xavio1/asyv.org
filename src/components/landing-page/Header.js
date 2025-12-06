// Simple header for the landing page
'use client'

import Link from 'next/link'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export default function Header() {
	const { theme, toggle } = useTheme()

	return (
		<header className="py-6 px-4 max-w-6xl mx-auto">
			<div className="flex items-center justify-between">
				<Link href="/" className="text-2xl font-bold">ASYV</Link>
				<nav className="flex items-center space-x-4">
					<Link href="#features" className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">Features</Link>
					<Link href="#stories" className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">Stories</Link>
					<Link href="#mentorship" className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">Mentorship</Link>

					<button
						aria-label="Toggle dark mode"
						onClick={toggle}
						className="ml-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					>
						{theme === 'dark' ? (
							<Sun className="w-5 h-5 text-yellow-300" />
						) : (
							<Moon className="w-5 h-5 text-gray-700" />
						)}
					</button>
				</nav>
			</div>
		</header>
	)
}
