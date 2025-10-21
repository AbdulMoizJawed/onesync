import { Components } from 'react-markdown'
import React from 'react'

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement>
type ParagraphProps = React.HTMLAttributes<HTMLParagraphElement>
type ListProps = React.HTMLAttributes<HTMLUListElement> | React.HTMLAttributes<HTMLOListElement>
type ListItemProps = React.LiHTMLAttributes<HTMLLIElement>
type BlockquoteProps = React.BlockquoteHTMLAttributes<HTMLQuoteElement>
type CodeProps = React.HTMLAttributes<HTMLElement> & { inline?: boolean; className?: string }
type PreProps = React.HTMLAttributes<HTMLPreElement>
type ImgProps = React.ImgHTMLAttributes<HTMLImageElement>
type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement>
type TableProps = React.TableHTMLAttributes<HTMLTableElement>
type ThProps = React.ThHTMLAttributes<HTMLTableCellElement>
type TdProps = React.TdHTMLAttributes<HTMLTableCellElement>
type HrProps = React.HTMLAttributes<HTMLHRElement>
type StrongProps = React.HTMLAttributes<HTMLElement>
type EmProps = React.HTMLAttributes<HTMLElement>

export const markdownComponents: Components = {
  h1: ({ node, ...props }: any) => <h1 {...(props as HeadingProps)} />, // react-markdown supplies node which we ignore
  h2: ({ node, ...props }: any) => <h2 {...(props as HeadingProps)} />,
  h3: ({ node, ...props }: any) => <h3 {...(props as HeadingProps)} />,
  p: ({ node, ...props }: any) => <p {...(props as ParagraphProps)} />,
  ul: ({ node, ...props }: any) => <ul {...(props as React.HTMLAttributes<HTMLUListElement>)} />,
  ol: ({ node, ...props }: any) => <ol {...(props as React.HTMLAttributes<HTMLOListElement>)} />,
  li: ({ node, ...props }: any) => <li {...(props as ListItemProps)} />,
  blockquote: ({ node, ...props }: any) => <blockquote {...(props as BlockquoteProps)} />,
  code: ({ node, inline, className, ...props }: any) =>
    inline ? <code className={className} {...(props as CodeProps)} /> : <code className={className} {...(props as CodeProps)} />,
  pre: ({ node, ...props }: any) => <pre {...(props as PreProps)} />,
  img: ({ node, ...props }: any) => <img {...(props as ImgProps)} />,
  a: ({ node, ...props }: any) => <a {...(props as AnchorProps)} />,
  table: ({ node, ...props }: any) => <table {...(props as TableProps)} />,
  th: ({ node, ...props }: any) => <th {...(props as ThProps)} />,
  td: ({ node, ...props }: any) => <td {...(props as TdProps)} />,
  hr: ({ node, ...props }: any) => <hr {...(props as HrProps)} />,
  strong: ({ node, ...props }: any) => <strong {...(props as StrongProps)} />,
  em: ({ node, ...props }: any) => <em {...(props as EmProps)} />
}