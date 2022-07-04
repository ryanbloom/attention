import React from 'react'

const cleanToken = t => t.replace('Ġ', ' ').replace('Ċ', ' ')

const maxLogit = Math.log(1.0)
const minLogit = Math.log(1e-5)

const rainbow = [
    '#ff0000', '#ff9900', '#00dd00', '#3366ff', '#dd00dd', '#eeee00'
]

const colormapRanges = {
    'viridis': [0, 0.85]
}

function colorMap(x, colormapName) {
    if (!colormapName) {
        colormapName = 'viridis'
    }
    if (x > 1) {
        x = 1
    }

    let minShade = 0.0
    let maxShade = 1.0
    if (colormapName in colormapRanges) {
        [minShade, maxShade] = colormapRanges[colormapName]
    }

    let scaledShade = x * (maxShade - minShade) + minShade
    return evaluate_cmap(scaledShade, colormapName, false)
}

function colorMapStyle(x, colormapName) {
    return {
        color: 'white',
        // color: 'black',
        // backgroundColor: `rgb(${colorMap(x, colormapName).join(',')})`
        background: 'black',
        // fontWeight: 900,
        // color: `rgb(${colorMap(x, colormapName).join(',')})`
    }
}

function logitStyle(p) {
    let shade = 0
    if (p > 0) {
        let correct_logit = Math.log(p)
        shade = (correct_logit - minLogit) / (maxLogit - minLogit)
    }
    return colorMapStyle(shade, 'plasma')
}

function headColor(i) {
    // return rainbow[i % rainbow.length]
    let rgb = ['#ff0000', '#00cc00', '#2266ff']
    return rgb[i % 3]
    // return `rgb(${colorMap(i/11, 'viridis').join(',')})`
}

function Attention(props) {
    if (!props.weight) {
        return <div></div>
    }

    return <div className='z-10 grow flex flex-col'>
        <div className='bg-black flex flex-col grow' onClick={_ => props.toggleHover()}>
            {
                props.weight.heads.map((w, i) =>
                    <div className='w-full grow basis-1' key={i} style={{background: headColor(i), opacity: w}}></div>
                )
            }
        </div>
    </div>
}

function ProbCell(props) {
    let r = props.r
    let key = props.k

    // let opacity = props.prob
    let opacity = (Math.log(props.prob) - minLogit) / (maxLogit - minLogit)
    // let opacity = props.top ? 1 : 0.5
    // if (props.hoveredToken) {
    //     opacity = props.hoveredToken == key ? 1 : 0.4
    // }
    let attention = []
    if ('attention' in props) {
        attention = <Attention weight={props.attention} toggleHover={props.toggleAttentionHover} expanded={props.expandedAttention} />
    } else {
        attention = <div style={{height: '8px', flexBasis: '8px'}}></div>
    }
    let ps = logitStyle(r.correct_prob)

    // Uncomment to visualize attention instead of logit
    // let ps = colorMapStyle(props.attention ? props.attention.reduced : 0)

    if (props.expandedAttention) {
        ps.zIndex = 10
    }
    let hoverMatchStyle = {
        // Repeat the glow effect 3 times so it's brighter
        textShadow: 'white 0px 0px 12px, white 0px 0px 12px, white 0px 0px 12px',
        zIndex: 5
    }
    return <div style={ps} className='flex flex-col grow justify-center' onMouseOver={_ => props.hover && props.hover(key)}>
            {attention}
            <div className='px-1 flex flex-col grow justify-end h-5' style={props.hoveredToken && props.hoveredToken == key ? hoverMatchStyle : {}}>
                <span style={{opacity: opacity}}>{cleanToken(key)}</span>
            </div>
    </div>
}

export function TopColumn(props) {
    return <div className='top-column grow' style={{display: "flex", flexDirection: "column"}}>
        <div className='p-1'>{cleanToken(props.data.input_token)}</div>
        {
            props.data.rows.map((r, i) => {
                const top_token = Object.keys(r.top_tokens)[0]
                return <div key={i} className='flex flex-row grow'>
                    <ProbCell hoveredToken={props.hoveredToken} hover={props.hover}
                    r={r} k={top_token} isTop={true}
                    prob={r.top_tokens[top_token]}
                    toggleAttentionHover={_ => i == props.hoveredAttentionLayer ? props.setAttentionHover(null) : props.setAttentionHover(i)}
                    expandedAttention={props.hoveredAttentionLayer == i}
                    attention={props.attentionPattern && props.attentionPattern[i]}/>
                </div>
            })
        }
        <div className='p-1'>{cleanToken(props.data.target_token)}</div>
    </div>
}

export function Column(props) {
    let t = props.data
    
    let rest = []
    if (!props.topOnly) {
        let cells = []
        for (let j = 0; j < t.rows.length; j++) {
            let l = t.rows[j]
            let token_cells = []
            let top_tokens = Object.keys(l.top_tokens)
            for (let ki = 1; ki < top_tokens.length; ki++) {
                let key = top_tokens[ki]
                let prob = l.top_tokens[key]
                token_cells.push(
                    <ProbCell hoveredToken={props.hoveredToken}
                        hover={props.setHoveredToken}
                        prob={prob}
                        r={l} k={key} key={ki} top={false} />
                )
            }
            cells.push(
                <div style={logitStyle(l.max_correct_prob)} key={j} className='flex flex-row cell-row grow'>
                    {token_cells}
                </div>
            )
        }
        rest = <div className='flex flex-col overflow-hidden' key={props.index} style={{width: '400px'}}>
            <div style={{height: '27px'}}></div>
                {cells}
            <div style={{height: '27px'}}></div>
        </div>
    }

    return <div key={props.index} className='outer-column flex flex-row snap-end items-stretch grow bg-black'>
        <TopColumn hoveredAttentionLayer={props.hoveredAttentionLayer}
            setAttentionHover={props.setAttentionHover} hoveredToken={props.hoveredToken}
            hover={props.setHoveredToken} data={props.data}
            attentionPattern={props.attentionPattern}>
        </TopColumn>
        {rest}
    </div>
}
