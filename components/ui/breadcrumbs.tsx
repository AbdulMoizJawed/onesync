import React from 'react'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
  active?: boolean
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-600">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {item.href ? (
            <a
              href={item.href}
              className={`hover:text-gray-900 transition-colors ${
                item.active ? 'text-gray-900 font-medium' : ''
              }`}
            >
              {item.label}
            </a>
          ) : (
            <span
              className={item.active ? 'text-gray-900 font-medium' : ''}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}