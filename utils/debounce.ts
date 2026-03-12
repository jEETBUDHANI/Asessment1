
export function debounce(fn:Function, delay:number){
  let timer:any
  return (...args:any[])=>{
    clearTimeout(timer)
    timer = setTimeout(()=>fn(...args),delay)
  }
}
