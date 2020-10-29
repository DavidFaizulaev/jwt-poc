const { JWK, JWT } = require('jose');
const uuid = require('uuid');

const validity = 144000;
const issuerName = 'issuer_name';

const privateKeyBase64Encoded = 'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUpRd0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQ1Mwd2dna3BBZ0VBQW9JQ0FRRFJEU2pmSXFHUUxwdGoKeWxDcUxZSDMyUnRTWmZJRGNPNWZGTDdqNTJDaXc5YnlZeGFtZ0xnSEpGdnNhZVdMb3pGZzJrZGJ6VytnRlVLTwpYMFBna2dFMVF5NEQ5aC9pbGxQZCtGRitoOE95K1lOaGFvMDN6cm95bkVyMkZtLzdYUjNTMzNKbGEvSXNNT1FBClRwdWN2eHFldUppbTZtMldRd2F1VUtXeXg3bTFsdGd0NUdDL1BhZG5iV2Y1RzV1OGVEa1BIeWNGaWpkdlY3eEoKaVpoRXZST2tnRmdhQnk0akhraVRlQ2RCajRlWEZIdTNnUm9pOS9jdUdMRzZkNDdmK01COXA1YUIyd0FMYnpOcgp6dnRQVkZvYU0zNUxvemVmTnV4d0NqREVZTU5BanBJNFlIblp6bDV3TkkxczQwUzhMQURNRG1EbVpadXJEeXN1CnhmQ2JBcXZ2dWx0Vk03cHpMRTczbkMrMk5PQ2M3QldzSUFZdVBvdmpxT3RjNjRlVll2eDlVcDBEZjlnUVloeWgKMlpTbHdldFg0R21DbytQT1NaTm55T3NSZjBjamZuYkIvcHdFb2JqMG45Wm5wUTFUM0thYW9WcjUzb1BaTVh0SwpCM3pPRFpEa2tsT2hXeGlnd0FOSWhXMExXR0R3d2FDYzNtTjV6WU1pTnhkQzNibWJKelArZEF0M2JqeUVMRCtXCndkVVNTcmNERW9IVzMvdE1tM1N0cFBoMzBTdkxwaVZxYlJlU0RvVWp5WVdzVysxbURsTlhaY2FFYzgwTW03amoKcjdMamlrSHl1UEMvNkpXRmYyZjZ3TXpoUnpaY01iRW5GaC9WRy95RG03YlZqUjQ1OGphTHBwdW4vVldOcXZvagpReGowVkNOQ1k3bitqanNzbVNjeWVIMC8wM3pITVFJREFRQUJBb0lDQVFDRjhNNk5HTjAzU2dWWmpKamVVRVlECmpPRUtqRExocll1czg5ZlNvYjZ5eXBOL3Zha1hpVVZmbmhZZmhVSURrODNoWmpsdVFsUVExMDVMZGhKQllvclAKbTNseUpGSU5sWStxbXAxc1dvUXl1ZGRKcFVGUnpteFNYUDFTYXRIWTFiSjBGNkp1QlJtbTRyUlMxZ3F5QldlQwo1bmM0Q3QrbjlNM2xCZHNFang4WGo4eDJxdXFwM1ZEUzNiQk9WVGdWSzFvenJCd09XcDVtQW1xckd6T3FaeEtjCnhYYXRSb2h6QzhZb1prV1FwZXVVQ3hXeFgxQmxzMFoyREhCakxwTW1RWFRqaldyTFRJdmN4NlRFb0ZzNFdxMVkKT0VIbEtIQk0zSjNrczBMSHI4K3FIeTdrWER2Mkoxa3V2eDBWOVE5bkdUSnhpNHplVVovSm0vQnBDWDI5YzVyQQoxazdqeGFjZnp0aUJ0QWlydEJ3ZGJmWUpZWklYMDZBVzcvbXdNak5sVjkwa2w3VnI2TjM5R1lyVmpMTjRtRlQ2CmdNWVkva3l4ZVl1ZUVjQnpOTFFNZ3phbkljWkpmRWJDUWgvVDVzdnFqL0twUE1uby9MWDlZVkhkYjVpaXhla28Kc3M2WjErVjhnTXZYbXg3RzJqVTF4RmNNUE5vc3lOeXNXdlpGaU1iVUlMazVoeU9IL25UM2taMnhHS3NVcXpEagpJZXArSU9WUWdoMmZ0ZzdCUm5xVjhtZm1TQVF1Um43dnJvNU41bzdtVDhMTENoUXI0ZHpXRXcrcktRRG5Ec2diCmxNaVhnQTlqM3Z6NmNuRVlKUTdocjNnUmNOenFtOVBHMWRCR1RSUUY3WEVZSzU2WTEyUkl4WTdvVkF4dzAwM0kKbmNGODNiNWkzVGdXMFJsZkt2R2lvUUtDQVFFQS84czVUWExNU0xXR2ZRYWN5T0xRNTFoSE9CdGF1dGdCRU03RwplODdzOXV3Nmx1VTFHTVVoSUhqUCtwMis5bzNpV0VQRHBPaGdZTGhUQ29PbDNwZlFxN05uOGRCQVR0MUZDMlJJCkIvZGxxUk9YRnl2OWRKYldoNCtnS3VxOXNNMzVzbmxoa3Z4MjhHUkQ0S1Azdks3TXZEVGdaM2JjS3VXd0tKK0sKRnU0NHBGamxSc05iNWdUNGl5akhvOSs0VTFmeVd2eVZMWERTeXcwRFNvVUpoa1JuZTRFRU9wQ0ZBN1lMQWRLVwo4YTBrSmNvM3JYOXZ6bGtRcDZ1UW9HQ0I2cVQ2cXZGSk1JdjVnMm1MM29YWEZQMWhXa2RuakorMU4wWnNFTTRyCmNqSmllRXVGODN4MkNxQXk4UlEweVdKeVZZTElFeW93QmVXTnhNYTNnT04yOWNTb0RRS0NBUUVBMFRoS3NjVU4KU2d2V09kWmVhMTdpS1VaQnRMNndtMFhpbmtEWmhtcHFiM3lsRkhMNkdoa0lENE5xVTk1TXNoYyttaWRGakN2VApnL3hKTkJwL3JjSzllN2c2c3IwOHBQM0RXaVlTdnV4a08vU3pNRkxTM2YwWHlYSHVzazdRcjJpVjBFa3VPRjNKCklNUVlnMVl3MUdncDQ1RXFsV1NjN3hJZzllZ0lMNFZ0QmtyUUE2OEFKVlhDcmNaVUVrbkxiSTFzTEsxRFNVcUQKVkJGNHRDM2NCb1kxR3pUUU8wUnk3UXk3dGdzcWRKOW94dHpzazFNSHlEWkdIVFRPSmQzeVJvVnUrOFNMS2NpdApyejVhc2ZoYU5VMGVhRXZiVHRZQmVvUk5aenlIbzIrMC9BUGpEYy9BbjNVVkJIL003UFhHSHQvb2dsS0J3V3FOCmdWV0s2OHZmbDdaT3RRS0NBUUVBM21NL05KaUVCd3JiSEVQdGQ3SEswZmVzSTVtVXJqRXg2L3o2RDVYOTYwZkMKUUlLU1FURFI5anRUQnA2eThnUzFMdXZyWXFvdGNLbVFlT213QWZDWG1VL25KUk5iZGJWbVc5c1p6T05JWFZFTQo0VFo3cXl1ZzVFYjRoNWVDeC82c0FvRUpWaE50RE43L0xJVWgwOGRkZEp1OEpmZnV2dFRtN01xWDhndTI3eHZpCmFqMWEzb2FmMTh6aWxSVGlXb054ejYwZHZWNER4a2xQL1MvZzhmenl3eXVPRTZTbUlHM2E4QUM0L3ZEN0ptZkQKTkhKQk1ITzZ5U3VlRi9FUHdvTWc5QkhIQWhBUUpESlZTbWV1Y1M5QnZvMnA5MWE2NUkyelVvRU13TUlSWG1pNgowcy80aUpCeSthb0pvclNXbHNXWFVTSXlrazNiamFMKzAyM3ZkUWsrMlFLQ0FRQVZDYklKR2lWeDhxckIraHBZCmRad01SbkpJK0h2TndVTStZb3I5QnlwWXQ1SHA4bjNQcmdDdmZxbHNjWWdJeUdtVkdxblZwSHFLWlEzL1hVTEYKZURXUmdUNzF4aTJZOGFONUp5YnZaOW5VWlpDM0pUenE4WTQ0eFdvWkorKzRFNjRzMlk3NlFBUC9kWGg1akdzdwprS0RWcnowMjlIMExWU2xYVU5PeDQ1ckk3VERwamVsWDE3M1J0NFd3cVJiNWZXY0pQd3JyRGNFUzdRYlVKMkJlCmo1UTdmaDRLTjZITzBGNzN1VHUxcW1uZ3hVcE1yaWEwTFREenN1R2YwU2VSaTgxVEo3cE9vMDFEdCtOcXpleFUKTzhMNC9kZTVuNjlhWUg5Z0NDZ2plUkliM1ZBeGpWaHpNRlRDdFE4b0xMYVZXREtMR0R6UDlDVHlnbVdMdkY1cApaUDJaQW9JQkFFK3l5RWdldFJ3blA0MDNkMUQ5TThhVG9HWVJzMDRWN2drRitzb0U2Z0hsNkZaU0pucG9zWWxZClBIMjN1dDZERG0xSCtYQzN2RFJSaURDRHBYUTVGWE9pZm1vaFpEVTBoZmpjUHo4akd4Y256NDRMRXI5NUpvTkMKVnNVNnVBc1JlSzNhT0pyWDZ3L1VTWWZQMUduL2pwWWZyem5ZU0xvcllybmlJYzl3TEVZaG0xVnJlWFluRmlKeApsUkh2djB1eXZkUCthb00rVndXWFBTTWtRdTZhL045K3JLQjFpR0VyRWF5cC9CWnBvSEFiKzhXWEQrVllycmR5CmZoa2V5cnRnNzdHTTc3Y2krMHJuNGdhU3JZU1d0bm9NeXNlUzg1UXdDcjZ3Vm5rc2UvTzVpdHltVE5VeFhIa08KV3NGNy9WdVMvRStnYW5ReXUzVWEwV2NUdmZySTQzbz0KLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQo=';
const publicKeyBase64Encoded = 'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQ0lqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FnOEFNSUlDQ2dLQ0FnRUEwUTBvM3lLaGtDNmJZOHBRcWkyQgo5OWtiVW1YeUEzRHVYeFMrNCtkZ29zUFc4bU1XcG9DNEJ5UmI3R25saTZNeFlOcEhXODF2b0JWQ2psOUQ0SklCCk5VTXVBL1lmNHBaVDNmaFJmb2ZEc3ZtRFlXcU5OODY2TXB4SzloWnYrMTBkMHQ5eVpXdnlMRERrQUU2Ym5MOGEKbnJpWXB1cHRsa01HcmxDbHNzZTV0WmJZTGVSZ3Z6Mm5aMjFuK1J1YnZIZzVEeDhuQllvM2IxZThTWW1ZUkwwVApwSUJZR2djdUl4NUlrM2duUVkrSGx4Ujd0NEVhSXZmM0xoaXh1bmVPMy9qQWZhZVdnZHNBQzI4emE4NzdUMVJhCkdqTitTNk0zbnpic2NBb3d4R0REUUk2U09HQjUyYzVlY0RTTmJPTkV2Q3dBekE1ZzVtV2JxdzhyTHNYd213S3IKNzdwYlZUTzZjeXhPOTV3dnRqVGduT3dWckNBR0xqNkw0NmpyWE91SGxXTDhmVktkQTMvWUVHSWNvZG1VcGNIcgpWK0JwZ3FQanprbVRaOGpyRVg5SEkzNTJ3ZjZjQktHNDlKL1daNlVOVTl5bW1xRmErZDZEMlRGN1NnZDh6ZzJRCjVKSlRvVnNZb01BRFNJVnRDMWhnOE1HZ25ONWplYzJESWpjWFF0MjVteWN6L25RTGQyNDhoQ3cvbHNIVkVrcTMKQXhLQjF0LzdUSnQwcmFUNGQ5RXJ5NllsYW0wWGtnNkZJOG1GckZ2dFpnNVRWMlhHaEhQTkRKdTQ0Nit5NDRwQgo4cmp3ditpVmhYOW4rc0RNNFVjMlhER3hKeFlmMVJ2OGc1dTIxWTBlT2ZJMmk2YWJwLzFWamFyNkkwTVk5RlFqClFtTzUvbzQ3TEprbk1uaDlQOU44eHpFQ0F3RUFBUT09Ci0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLQo=';

function generateJwtToken() {
    const buff = Buffer.from(privateKeyBase64Encoded, 'base64');
    // decode private key to string
    const privateKeyString = buff.toString('utf8');
    console.log(privateKeyString)

    const privateKeyJWK = JWK.asKey(privateKeyString, { alg: 'RS512', use: 'sig' });

    const id = uuid.v4();
    const now = new Date();
    const time = Math.floor(now.getTime() / 1000);
    const claims = {
        iss: issuerName,
        exp: time + validity,
        nbf: time,
        jti: id
    };

    const signedJWT = JWT.sign(claims, privateKeyJWK, { algorithm: 'RS512', iat: true, kid: true, now });
    return signedJWT;
}

function validateJwtToken(jwtToken) {
    const buff = Buffer.from(publicKeyBase64Encoded, 'base64');
    // decode private key to string
    const publicKeyString = buff.toString('utf8');
    console.log(publicKeyString)

    const publicKeyJWK = JWK.asKey(publicKeyString);
    const decryptedValue = JWT.verify(jwtToken, publicKeyJWK, { issuer: issuerName });
    return decryptedValue;
}

const signedJWTToken = generateJwtToken();
console.log(signedJWTToken);
const decryptedPayload = validateJwtToken(signedJWTToken);
console.log(decryptedPayload);

















