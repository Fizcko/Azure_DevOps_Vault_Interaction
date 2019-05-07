## Vault Interaction
  This extension provide the ability to interact with HashiCorp Vault.

## Utilities

- ### Vault - Read KV secrets

  Provide the ability to read KV secrets from HashiCorp Vault and load them into variables.

  Authentication methods available in the extension :

  - Client Token
  - Username & Password
  - LDAP
  - AppRole

  __Example use case :__ Read secrets from a KV v2 engine call « ALM » located at path « APP1/DEV »

  ![KV v2](screenshots/kv_read_01.png)

  ![Secrets path](screenshots/kv_read_02.png)

  ![Azure DevOps configuation](screenshots/kv_read_03.png)

  ![Azure DevOps output log](screenshots/kv_read_04.png)

  There is now two variables called « APP1_key_1 » and « APP1_key_2 » that you can used in your next tasks by using $(APP1_key_1) and/or $(APP1_key_2).


## Release note

### v1.0.0
- Read secret from a KV engine (v1 or v2) and load them into variables.

