import { plugins, registerPlugin } from '../../src/utils/registerPlugin'
import { expect } from '@jest/globals'

describe('Register Plugin', () => {
  it('should push plugin to the plugins global variable', () => {
    registerPlugin({ name: 'My Plugin', type: 'processOpenClientResponse', callback: () => {} })
    const plugin = plugins[0]
    expect(Array.isArray(plugins)).toBeTruthy()
    expect(plugin).toMatchObject(expect.objectContaining({ name: 'My Plugin', type: 'processOpenClientResponse' }))
    expect(typeof plugin.callback).toBe('function')
  })
})
