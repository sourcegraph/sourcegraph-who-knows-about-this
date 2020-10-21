import sourcegraph from 'sourcegraph'
import { Hunk, queryBlameHunks } from './blame'
import { uniqBy } from 'lodash'

function getHoverContent(authors: Hunk['author']['person'][]): string {
    const authorLines = authors.map(author => `- ${author.displayName} &lt;${author.email}&gt;`).join('\n')
    return `*Who might know about this code:*\n\n${authorLines}\n`
}

async function getAuthorsOfSurroundingCode(
    documentUri: string,
    lineNumber: number
): Promise<Hunk['author']['person'][]> {
    const blameHunks = await queryBlameHunks(documentUri)
    const authors = blameHunks.map(hunk => hunk.author.person)
    const uniqueAuthors = uniqBy(authors, 'email')
    return uniqueAuthors
}

export function activate(context: sourcegraph.ExtensionContext): void {
    context.subscriptions.add(
        sourcegraph.languages.registerHoverProvider(['*'], {
            provideHover: async (document, position) => {
                const authors = await getAuthorsOfSurroundingCode(document.uri, position.line)

                return {
                    contents: {
                        value: getHoverContent(authors),
                        kind: sourcegraph.MarkupKind.Markdown,
                    },
                }
            },
        })
    )
}
