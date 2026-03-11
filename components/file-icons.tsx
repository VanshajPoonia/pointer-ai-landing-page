'use client'

import React from 'react'

interface FileIconProps {
  filename: string
  className?: string
  size?: number
}

// VS Code-style file icons based on extension
export function FileIcon({ filename, className = '', size = 16 }: FileIconProps) {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const name = filename.toLowerCase()
  
  // Get icon color and symbol based on file type
  const getIconConfig = () => {
    // Special filenames
    if (name === 'package.json') return { color: '#8bc34a', symbol: '{}', bg: '#8bc34a20' }
    if (name === 'tsconfig.json') return { color: '#3178c6', symbol: 'TS', bg: '#3178c620' }
    if (name === 'tailwind.config.js' || name === 'tailwind.config.ts') return { color: '#38bdf8', symbol: '🌊', bg: '#38bdf820' }
    if (name === '.gitignore') return { color: '#f05032', symbol: '', bg: '#f0503220' }
    if (name === '.env' || name.startsWith('.env.')) return { color: '#ecd53f', symbol: '#', bg: '#ecd53f20' }
    if (name === 'dockerfile') return { color: '#2496ed', symbol: '🐳', bg: '#2496ed20' }
    if (name === 'readme.md') return { color: '#519aba', symbol: 'i', bg: '#519aba20' }
    
    // Extension-based icons
    switch (ext) {
      // JavaScript/TypeScript
      case 'js':
        return { color: '#f7df1e', symbol: 'JS', bg: '#f7df1e20' }
      case 'jsx':
        return { color: '#61dafb', symbol: 'JSX', bg: '#61dafb20' }
      case 'ts':
        return { color: '#3178c6', symbol: 'TS', bg: '#3178c620' }
      case 'tsx':
        return { color: '#3178c6', symbol: 'TSX', bg: '#3178c620' }
      case 'mjs':
        return { color: '#f7df1e', symbol: 'MJS', bg: '#f7df1e20' }
      
      // Python
      case 'py':
        return { color: '#3776ab', symbol: 'PY', bg: '#3776ab20' }
      case 'pyw':
        return { color: '#3776ab', symbol: 'PY', bg: '#3776ab20' }
      case 'ipynb':
        return { color: '#f37626', symbol: 'NB', bg: '#f3762620' }
      
      // Java/Kotlin
      case 'java':
        return { color: '#f89820', symbol: 'J', bg: '#f8982020' }
      case 'kt':
      case 'kts':
        return { color: '#7f52ff', symbol: 'K', bg: '#7f52ff20' }
      
      // C/C++/C#
      case 'c':
        return { color: '#a8b9cc', symbol: 'C', bg: '#a8b9cc20' }
      case 'h':
        return { color: '#a8b9cc', symbol: 'H', bg: '#a8b9cc20' }
      case 'cpp':
      case 'cc':
      case 'cxx':
        return { color: '#00599c', symbol: 'C++', bg: '#00599c20' }
      case 'hpp':
        return { color: '#00599c', symbol: 'H++', bg: '#00599c20' }
      case 'cs':
        return { color: '#68217a', symbol: 'C#', bg: '#68217a20' }
      
      // Go/Rust
      case 'go':
        return { color: '#00add8', symbol: 'GO', bg: '#00add820' }
      case 'rs':
        return { color: '#dea584', symbol: 'RS', bg: '#dea58420' }
      
      // Ruby/PHP
      case 'rb':
        return { color: '#cc342d', symbol: 'RB', bg: '#cc342d20' }
      case 'php':
        return { color: '#777bb4', symbol: 'PHP', bg: '#777bb420' }
      
      // Swift/Dart
      case 'swift':
        return { color: '#fa7343', symbol: 'SW', bg: '#fa734320' }
      case 'dart':
        return { color: '#0175c2', symbol: 'D', bg: '#0175c220' }
      
      // Web
      case 'html':
      case 'htm':
        return { color: '#e34c26', symbol: '<>', bg: '#e34c2620' }
      case 'css':
        return { color: '#264de4', symbol: '#', bg: '#264de420' }
      case 'scss':
      case 'sass':
        return { color: '#cc6699', symbol: 'S', bg: '#cc669920' }
      case 'less':
        return { color: '#1d365d', symbol: 'L', bg: '#1d365d20' }
      case 'vue':
        return { color: '#42b883', symbol: 'V', bg: '#42b88320' }
      case 'svelte':
        return { color: '#ff3e00', symbol: 'S', bg: '#ff3e0020' }
      
      // Data formats
      case 'json':
        return { color: '#cbcb41', symbol: '{}', bg: '#cbcb4120' }
      case 'yaml':
      case 'yml':
        return { color: '#cb171e', symbol: 'Y', bg: '#cb171e20' }
      case 'xml':
        return { color: '#e37933', symbol: '<>', bg: '#e3793320' }
      case 'toml':
        return { color: '#9c4121', symbol: 'T', bg: '#9c412120' }
      
      // Documentation
      case 'md':
      case 'mdx':
        return { color: '#519aba', symbol: 'M', bg: '#519aba20' }
      case 'txt':
        return { color: '#6d8086', symbol: 'TXT', bg: '#6d808620' }
      case 'pdf':
        return { color: '#f40f02', symbol: 'PDF', bg: '#f40f0220' }
      
      // Shell/Scripts
      case 'sh':
      case 'bash':
        return { color: '#4eaa25', symbol: '$', bg: '#4eaa2520' }
      case 'zsh':
        return { color: '#4eaa25', symbol: 'Z', bg: '#4eaa2520' }
      case 'ps1':
        return { color: '#012456', symbol: 'PS', bg: '#01245620' }
      case 'bat':
      case 'cmd':
        return { color: '#c1f12e', symbol: 'BAT', bg: '#c1f12e20' }
      
      // Database
      case 'sql':
        return { color: '#e38c00', symbol: 'SQL', bg: '#e38c0020' }
      case 'db':
      case 'sqlite':
        return { color: '#003b57', symbol: 'DB', bg: '#003b5720' }
      
      // Images
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'ico':
      case 'webp':
        return { color: '#a074c4', symbol: 'IMG', bg: '#a074c420' }
      
      // Config files
      case 'env':
        return { color: '#ecd53f', symbol: '#', bg: '#ecd53f20' }
      case 'lock':
        return { color: '#6d8086', symbol: '🔒', bg: '#6d808620' }
      
      // Others
      case 'lua':
        return { color: '#000080', symbol: 'LUA', bg: '#00008020' }
      case 'r':
        return { color: '#276dc3', symbol: 'R', bg: '#276dc320' }
      case 'scala':
        return { color: '#dc322f', symbol: 'SC', bg: '#dc322f20' }
      case 'ex':
      case 'exs':
        return { color: '#6e4a7e', symbol: 'EX', bg: '#6e4a7e20' }
      case 'hs':
        return { color: '#5e5086', symbol: 'HS', bg: '#5e508620' }
      case 'pl':
        return { color: '#39457e', symbol: 'PL', bg: '#39457e20' }
      
      default:
        return { color: '#6d8086', symbol: '', bg: '#6d808620' }
    }
  }
  
  const config = getIconConfig()
  
  return (
    <div 
      className={`flex items-center justify-center rounded-sm ${className}`}
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: config.bg,
        fontSize: size * 0.45,
        fontWeight: 600,
        color: config.color,
      }}
    >
      {config.symbol.length <= 3 ? config.symbol : config.symbol.charAt(0)}
    </div>
  )
}

// Folder icon component
interface FolderIconProps {
  isOpen?: boolean
  folderName?: string
  className?: string
  size?: number
}

export function FolderIcon({ isOpen = false, folderName = '', className = '', size = 16 }: FolderIconProps) {
  const name = folderName.toLowerCase()
  
  // Special folder colors
  const getFolderColor = () => {
    if (name === 'src' || name === 'source') return '#42a5f5'
    if (name === 'components') return '#7c4dff'
    if (name === 'pages' || name === 'app') return '#26c6da'
    if (name === 'public' || name === 'static' || name === 'assets') return '#66bb6a'
    if (name === 'styles' || name === 'css') return '#ec407a'
    if (name === 'lib' || name === 'utils' || name === 'helpers') return '#ffa726'
    if (name === 'hooks') return '#ab47bc'
    if (name === 'api' || name === 'routes') return '#ef5350'
    if (name === 'tests' || name === '__tests__' || name === 'test') return '#78909c'
    if (name === 'config' || name === 'configs') return '#8d6e63'
    if (name === 'node_modules') return '#78909c'
    if (name === '.git') return '#f05032'
    if (name === 'dist' || name === 'build' || name === 'out') return '#ffca28'
    if (name === 'types' || name === '@types') return '#3178c6'
    return '#dcb67a' // Default folder color
  }
  
  const color = getFolderColor()
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
    >
      {isOpen ? (
        // Open folder
        <>
          <path 
            d="M2 6C2 4.89543 2.89543 4 4 4H9L11 6H20C21.1046 6 22 6.89543 22 8V10H4C2.89543 10 2 9.10457 2 8V6Z" 
            fill={color}
            opacity="0.7"
          />
          <path 
            d="M2 10H22V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V10Z" 
            fill={color}
          />
        </>
      ) : (
        // Closed folder
        <>
          <path 
            d="M2 6C2 4.89543 2.89543 4 4 4H9L11 6H20C21.1046 6 22 6.89543 22 8V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V6Z" 
            fill={color}
          />
          <path 
            d="M2 8H22V9H2V8Z" 
            fill="rgba(0,0,0,0.1)"
          />
        </>
      )}
    </svg>
  )
}
