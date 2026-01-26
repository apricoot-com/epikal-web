import { SiteBlock } from "@/src/lib/templating/blocks";
import { Badge } from "@/components/ui/badge";

export function BlockPreview({ block }: { block: SiteBlock }) {
    const { type, props } = block;

    if (type === 'hero') {
        const alignClass = props.alignment === 'center' ? 'items-center text-center' : props.alignment === 'right' ? 'items-end text-right' : 'items-start text-left';
        return (
            <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden border flex flex-col justify-center p-4">
                {props.backgroundImage && (
                    <img src={props.backgroundImage} alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                )}
                <div className={`relative z-10 flex flex-col ${alignClass} space-y-2`}>
                    <div className="h-6 bg-gray-800 w-3/4 opacity-80 rounded" >
                        <span className="text-xs text-white px-2 overflow-hidden block whitespace-nowrap">{props.title}</span>
                    </div>
                    <div className="h-3 bg-gray-400 w-1/2 rounded"></div>
                    <div className="h-8 w-24 bg-primary rounded mt-2 flex items-center justify-center text-[10px] text-white font-bold">CTA</div>
                </div>
            </div>
        );
    }

    if (type === 'features') {
        const cols = props.columns || 3;
        return (
            <div className="w-full bg-muted/30 border rounded-md p-4 space-y-4">
                <div className="text-center space-y-2">
                    <div className="h-5 bg-foreground/10 w-1/3 mx-auto rounded">
                        <span className="text-xs text-muted-foreground block overflow-hidden h-full">{props.title}</span>
                    </div>
                    <div className="h-2 bg-muted w-1/2 mx-auto rounded"></div>
                </div>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-card p-2 rounded shadow-sm flex flex-col items-center space-y-1">
                            <div className="h-6 w-6 bg-primary/20 rounded-full"></div>
                            <div className="h-3 bg-muted w-3/4 rounded"></div>
                            <div className="h-2 bg-muted/50 w-full rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'content') {
        return (
            <div className={`w-full bg-card border rounded-md p-4 flex flex-col ${props.alignment === 'center' ? 'items-center text-center' : 'items-start text-left'}`}>
                <div className="w-1/2 h-5 bg-foreground/10 mb-2 rounded">
                    <span className="text-xs text-foreground px-1">{props.title || 'Rich Text'}</span>
                </div>
                <div className="w-full space-y-1">
                    <div className="w-full h-2 bg-muted rounded"></div>
                    <div className="w-5/6 h-2 bg-muted rounded"></div>
                    <div className="w-4/5 h-2 bg-muted rounded"></div>
                </div>
            </div>
        );
    }

    if (type === 'services') {
        return (
            <div className="w-full bg-muted/30 border rounded-md p-4 space-y-4">
                <div className="text-center">
                    <div className="inline-block px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Services List</div>
                    <div className="h-4 bg-foreground/10 w-1/4 mx-auto mt-1 rounded"></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="aspect-[3/4] bg-card rounded shadow-sm border p-1 flex flex-col">
                            <div className="w-full h-1/2 bg-muted rounded-sm mb-1"></div>
                            <div className="h-3 bg-muted w-3/4 mb-1 rounded"></div>
                            <div className="flex-1"></div>
                            <div className="h-3 bg-primary/20 w-1/2 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (type === 'faq') {
        return (
            <div className="w-full bg-card border rounded-md p-4 space-y-3">
                <div className="h-5 bg-foreground/10 w-1/4 rounded mb-2">
                    <span className="text-xs text-foreground px-2">FAQ</span>
                </div>
                {[1, 2].map(i => (
                    <div key={i} className="border-b pb-2">
                        <div className="flex justify-between items-center mb-1">
                            <div className="h-3 bg-muted w-2/3 rounded"></div>
                            <div className="h-3 w-3 bg-muted/50 rounded-full"></div>
                        </div>
                        <div className="h-2 bg-muted/30 w-full rounded"></div>
                    </div>
                ))}
            </div>
        )
    }

    if (type === 'contact') {
        return (
            <div className="w-full bg-gray-900 text-white rounded-md p-4 flex justify-between items-center">
                <div className="space-y-2">
                    <div className="h-4 bg-white/20 w-24 rounded"></div>
                    <div className="space-y-1">
                        <div className="h-2 bg-white/10 w-32 rounded"></div>
                        <div className="h-2 bg-white/10 w-28 rounded"></div>
                    </div>
                </div>
                <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-white rounded-sm"></div>
                </div>
            </div>
        )
    }

    // Default Fallback
    return (
        <div className="flex items-center gap-4 p-4 border rounded-md bg-card">
            <div className="h-10 w-10 bg-muted rounded flex items-center justify-center font-bold text-muted-foreground">
                {(type as string).substring(0, 2).toUpperCase()}
            </div>
            <div>
                <p className="font-semibold text-sm">{type as string}</p>
                <Badge variant="outline" className="text-[10px]">Block</Badge>
            </div>
        </div>
    );
}
