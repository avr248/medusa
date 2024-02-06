import { Modules } from "@medusajs/modules-sdk"
import { IAuthModuleService } from "@medusajs/types"
import { SqlEntityManager } from "@mikro-orm/postgresql"
import { initModules } from "medusa-test-utils"
import { createAuthProviders } from "../../../__fixtures__/auth-provider"
import { createAuthUsers } from "../../../__fixtures__/auth-user"
import { MikroOrmWrapper } from "../../../utils"
import { getInitModuleConfig } from "../../../utils/get-init-module-config"

jest.setTimeout(30000)

describe("AuthModuleService - AuthProvider", () => {
  let service: IAuthModuleService
  let testManager: SqlEntityManager
  let shutdownFunc: () => Promise<void>

  beforeAll(async () => {
    const initModulesConfig = getInitModuleConfig()

    const { medusaApp, shutdown } = await initModules(initModulesConfig)

    service = medusaApp.modules[Modules.AUTH]

    shutdownFunc = shutdown
  })

  beforeEach(async () => {
    await MikroOrmWrapper.setupDatabase()
    testManager = MikroOrmWrapper.forkManager()

    await createAuthProviders(testManager)
    await createAuthUsers(testManager)
  })

  afterAll(async () => {
    await shutdownFunc()
  })

  afterEach(async () => {
    await MikroOrmWrapper.clearDatabase()
  })

  describe("listAuthProviders", () => {
    it("should list AuthProviders", async () => {
      const authProviders = await service.listAuthProviders()

      expect(authProviders).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            provider: "manual",
          }),
          expect.objectContaining({
            provider: "disabled",
          }),
          expect.objectContaining({
            provider: "store",
          }),
          expect.objectContaining({
            provider: "admin",
          }),
        ])
      )
    })

    it("should list authProviders by id", async () => {
      const authProviders = await service.listAuthProviders({
        provider: ["manual"],
      })

      expect(authProviders).toEqual([
        expect.objectContaining({
          provider: "manual",
        }),
      ])
    })

    it("should list active authProviders", async () => {
      const authProviders = await service.listAuthProviders({
        is_active: true,
      })

      expect(authProviders).toEqual([
        expect.objectContaining({
          provider: "manual",
        }),
        expect.objectContaining({
          provider: "store",
        }),
        expect.objectContaining({
          provider: "admin",
        }),
      ])
    })
  })

  describe("listAndCountAuthProviders", () => {
    it("should list and count AuthProviders", async () => {
      const [authProviders, count] = await service.listAndCountAuthProviders()

      expect(count).toEqual(4)
      expect(authProviders).toEqual([
        expect.objectContaining({
          provider: "manual",
        }),
        expect.objectContaining({
          provider: "disabled",
        }),
        expect.objectContaining({
          provider: "store",
        }),
        expect.objectContaining({
          provider: "admin",
        }),
      ])
    })

    it("should list and count authProviders by provider", async () => {
      const [authProviders, count] = await service.listAndCountAuthProviders({
        provider: ["manual"],
      })

      expect(count).toEqual(1)
      expect(authProviders).toEqual([
        expect.objectContaining({
          provider: "manual",
        }),
      ])
    })

    it("should list and count active authProviders", async () => {
      const [authProviders, count] = await service.listAndCountAuthProviders({
        is_active: true,
      })

      expect(count).toEqual(3)
      expect(authProviders).toEqual([
        expect.objectContaining({
          provider: "manual",
        }),
        expect.objectContaining({
          provider: "store",
        }),
        expect.objectContaining({
          provider: "admin",
        }),
      ])
    })
  })

  describe("retrieveAuthProvider", () => {
    const provider = "manual"

    it("should return an authProvider for the given provider", async () => {
      const authProvider = await service.retrieveAuthProvider(provider)

      expect(authProvider).toEqual(
        expect.objectContaining({
          provider,
        })
      )
    })

    it("should return authProvider based on config select param", async () => {
      const authProvider = await service.retrieveAuthProvider(provider, {
        select: ["provider"],
      })

      expect(authProvider).toEqual({
        provider,
      })
    })

    it("should throw an error when an authProvider with the given provider does not exist", async () => {
      let error

      try {
        await service.retrieveAuthProvider("does-not-exist")
      } catch (e) {
        error = e
      }

      expect(error.message).toEqual(
        "AuthProvider with provider: does-not-exist was not found"
      )
    })

    it("should throw an error when a provider is not provided", async () => {
      let error

      try {
        await service.retrieveAuthProvider(undefined as unknown as string)
      } catch (e) {
        error = e
      }

      expect(error.message).toEqual("authProvider - provider must be defined")
    })
  })

  describe("deleteAuthProvider", () => {
    const provider = "manual"

    it("should delete the authProviders given a provider successfully", async () => {
      await service.deleteAuthProviders([provider])

      const authProviders = await service.listAuthProviders({
        provider: [provider],
      })

      expect(authProviders).toHaveLength(0)
    })
  })

  describe("updateAuthProvider", () => {
    const provider = "manual"

    it("should throw an error when a id does not exist", async () => {
      let error

      try {
        await service.updateAuthProvider([
          {
            provider: "does-not-exist",
          },
        ])
      } catch (e) {
        error = e
      }

      expect(error.message).toEqual(
        'AuthProvider with provider "does-not-exist" not found'
      )
    })

    it("should update authProvider", async () => {
      await service.updateAuthProvider([
        {
          provider: "manual",
          name: "test",
        },
      ])

      const [provider] = await service.listAuthProviders({
        provider: ["manual"],
      })
      expect(provider).toEqual(
        expect.objectContaining({
          name: "test",
        })
      )
    })
  })

  describe("createAuthProvider", () => {
    it("should create a authProvider successfully", async () => {
      await service.createAuthProvider([
        {
          provider: "test",
          name: "test provider",
        },
      ])

      const [authProvider] = await service.listAuthProviders({
        provider: ["test"],
      })

      expect(authProvider).toEqual(
        expect.objectContaining({
          provider: "test",
        })
      )
    })
  })
})