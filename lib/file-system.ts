export interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  content?: string // Only for files
  language?: string // Only for files
  children?: FileNode[] // Only for folders
  parentId?: string | null
}

export interface FileSystemState {
  nodes: Record<string, FileNode>
  rootId: string
}

export const createDefaultFileSystem = (): FileSystemState => {
  const root: FileNode = {
    id: 'root',
    name: '~',
    type: 'folder',
    children: [],
    parentId: null,
  }

  const projectFolder: FileNode = {
    id: 'project',
    name: 'project',
    type: 'folder',
    children: [],
    parentId: 'root',
  }

  const srcFolder: FileNode = {
    id: 'src',
    name: 'src',
    type: 'folder',
    children: [],
    parentId: 'project',
  }

  const indexFile: FileNode = {
    id: 'index-js',
    name: 'index.js',
    type: 'file',
    content: '// Welcome to CodeIDE\nconsole.log("Hello, World!");',
    language: 'javascript',
    parentId: 'src',
  }

  const appFile: FileNode = {
    id: 'app-js',
    name: 'app.js',
    type: 'file',
    content: '// Main application file\n',
    language: 'javascript',
    parentId: 'src',
  }

  const readmeFile: FileNode = {
    id: 'readme-md',
    name: 'README.md',
    type: 'file',
    content: '# My Project\n\nWelcome to my project!',
    language: 'markdown',
    parentId: 'project',
  }

  const documentsFolder: FileNode = {
    id: 'documents',
    name: 'documents',
    type: 'folder',
    children: [],
    parentId: 'root',
  }

  srcFolder.children = [indexFile.id, appFile.id]
  projectFolder.children = [srcFolder.id, readmeFile.id]
  root.children = [projectFolder.id, documentsFolder.id]

  return {
    nodes: {
      root,
      project: projectFolder,
      src: srcFolder,
      'index-js': indexFile,
      'app-js': appFile,
      'readme-md': readmeFile,
      documents: documentsFolder,
    },
    rootId: 'root',
  }
}

export const getNodePath = (nodes: Record<string, FileNode>, nodeId: string): string => {
  const node = nodes[nodeId]
  if (!node || nodeId === 'root') return '~'
  
  const pathParts: string[] = []
  let current: FileNode | undefined = node
  
  while (current && current.parentId) {
    pathParts.unshift(current.name)
    current = nodes[current.parentId]
  }
  
  return '~/' + pathParts.join('/')
}

export const findNodeByPath = (
  nodes: Record<string, FileNode>,
  path: string
): FileNode | null => {
  if (path === '~') return nodes.root
  
  const parts = path.replace(/^~\/?/, '').split('/').filter(Boolean)
  let currentNode = nodes.root
  
  for (const part of parts) {
    if (!currentNode.children) return null
    const childId = currentNode.children.find(childId => nodes[childId]?.name === part)
    if (!childId) return null
    currentNode = nodes[childId]
  }
  
  return currentNode
}

export const downloadFile = (node: FileNode) => {
  if (node.type !== 'file' || !node.content) return
  
  const blob = new Blob([node.content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = node.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
